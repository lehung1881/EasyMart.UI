<template>
    <div
        ref="rootRef"
        class="cb-root"
        :class="{
            'cb-root--focused': isFocused,
            'cb-root--open': isOpen,
            'cb-root--disabled': disabled,
        }"
    >
        <!-- ── Input wrapper ─────────────────────────────────────────────── -->
        <div class="cb-input-wrap">
            <input
                ref="inputRef"
                v-model="inputText"
                class="cb-input"
                type="text"
                :placeholder="placeholder"
                :disabled="disabled"
                autocomplete="off"
                role="combobox"
                :aria-expanded="isOpen"
                aria-haspopup="listbox"
                :aria-activedescendant="activeIndex >= 0 ? `cb-item-${activeIndex}` : undefined"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @keydown="onKeydown"
            />

            <!-- Nút clear (×) — dùng mousedown.prevent để tránh blur -->
            <button
                v-if="hasClearValue"
                class="cb-btn cb-btn--clear"
                type="button"
                aria-label="Xoá giá trị"
                tabindex="-1"
                @mousedown.prevent="clearValue"
            >
                <span aria-hidden="true">×</span>
            </button>

            <!-- Nút toggle (▼) — chevron xoay khi mở -->
            <button
                class="cb-btn cb-btn--toggle"
                type="button"
                :aria-label="isOpen ? 'Đóng dropdown' : 'Mở dropdown'"
                tabindex="-1"
                :disabled="disabled"
                @mousedown.prevent="isOpen ? closeDropdown() : openDropdown()"
            >
                <svg
                    class="cb-chevron"
                    :class="{ 'cb-chevron--open': isOpen }"
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M2 4L6 8L10 4"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </div>

        <!-- ── Dropdown panel ────────────────────────────────────────────── -->
        <Transition name="cb-dropdown">
            <div v-if="isOpen" class="cb-panel" role="dialog" aria-label="Danh sách lựa chọn">
                <!-- Delegate rendering sang BaseComboboxDropdown (global registered) -->
                <BaseComboboxDropdown
                    :data="storeData"
                    :display-field="displayField"
                    :value-field="valueField"
                    :columns="columns"
                    :active-index="activeIndex"
                    :selected-value="modelValue"
                    :loading="store.loading"
                    @select="onSelect"
                >
                    <!-- Pass-through slots -->
                    <template v-for="(_, name) in $slots" #[name]="slotData">
                        <slot :name="name" v-bind="slotData ?? {}" />
                    </template>
                </BaseComboboxDropdown>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
/**
 * BaseCombobox.vue
 * Logic layer — Component chính xử lý toàn bộ interaction.
 * Delegates rendering dropdown sang BaseComboboxDropdown.
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import BaseComboboxDropdown from "@/components/base/BaseComboboxDropdown.vue";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Column {
    field: string;
    label: string;
    width?: string | number;
}

/**
 * Interface nội bộ của store — KHÔNG import từ useComboboxStore.
 * Pinia unwrap reactive khi access qua props, nên dùng type trực tiếp (không bọc { value }).
 */
interface ComboboxStore {
    data: Array<any>;
    loading: boolean;
    loadData: (keyword: string, displayField?: string) => Promise<void>;
    configure: (fn: (kw: string) => Promise<any[]>, mode?: "local" | "remote") => void;
    syncConfig: (fn: (kw: string) => Promise<any[]>, mode?: "local" | "remote") => void;
    reset: () => void;
    $dispose: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(
    defineProps<{
        /** v-model value — object hoặc primitive */
        modelValue: string | number | Record<string, any> | null;
        /** Instance từ useComboboxStore() */
        store: ComboboxStore;
        /** Field tên hiển thị trong input và dropdown */
        displayField: string;
        /** Field làm value khi emit */
        valueField: string;
        /** Nếu có → dropdown dạng bảng */
        columns?: Column[];
        /** Placeholder của input */
        placeholder?: string;
        /** Vô hiệu hoá component */
        disabled?: boolean;
        /** Debounce thời gian gõ (ms) */
        debounceTime?: number;
        /** Số ký tự tối thiểu để trigger search */
        minChars?: number;
    }>(),
    {
        placeholder: "Tìm kiếm...",
        disabled: false,
        debounceTime: 300,
        minChars: 0,
    },
);

// ─── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
    /** v-model binding */
    (e: "update:modelValue", value: any): void;
    /** Side effects khi chọn */
    (e: "change", value: any): void;
    /** Mỗi lần trigger search */
    (e: "search", keyword: string): void;
}>();

// ─── Internal State ───────────────────────────────────────────────────────────

/** Ref tới root element để detect click outside */
const rootRef = ref<HTMLElement | null>(null);
/** Ref tới input element */
const inputRef = ref<HTMLInputElement | null>(null);
/** Dropdown đang mở hay không */
const isOpen = ref(false);
/** Input đang được focus */
const isFocused = ref(false);
/** Text hiển thị trong input */
const inputText = ref("");
/** Index item đang active (keyboard nav), -1 = không có */
const activeIndex = ref(-1);
/** Timer debounce */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Computed ─────────────────────────────────────────────────────────────────

/**
 * Guard: luôn trả về array, không bao giờ undefined/null.
 * Pinia unwrap reactive khi access qua props nên không cần .value.
 */
const storeData = computed<Array<any>>(() => props.store.data ?? []);

/** Có giá trị để hiển thị nút clear hay không */
const hasClearValue = computed(() => inputText.value && !props.disabled);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * getDisplayText — Lấy text hiển thị từ modelValue.
 * null/undefined → ''
 * object         → value[displayField]
 * primitive      → tìm trong storeData; nếu không thấy → String(value)
 */
const getDisplayText = (value: typeof props.modelValue): string => {
    if (value == null) return "";
    if (typeof value === "object") return String((value as Record<string, any>)[props.displayField] ?? "");
    // Tìm trong storeData để lấy display text
    const found = storeData.value.find((item) => item[props.valueField] === value);
    return found ? String(found[props.displayField]) : String(value);
};

/** closeDropdown — Đóng dropdown và reset activeIndex */
const closeDropdown = () => {
    isOpen.value = false;
    activeIndex.value = -1;
};

// ─── Core Actions ─────────────────────────────────────────────────────────────

/**
 * openDropdown — Mở dropdown và trigger load data.
 * Luôn gọi store.loadData() trước khi check isOpen
 * để đảm bảo data luôn fresh kể cả khi dropdown đã mở.
 */
const openDropdown = () => {
    if (props.disabled) return;
    // Luôn load trước — không guard bằng isOpen
    props.store.loadData("", props.displayField);
    if (isOpen.value) return; // guard UI
    isOpen.value = true;
};

/**
 * onSelect — Xử lý khi user chọn một item.
 * modelValue là object → emit nguyên item
 * modelValue là primitive → emit item[valueField]
 */
const onSelect = (item: any) => {
    const isObjectMode = typeof props.modelValue === "object" && props.modelValue !== null;
    const value = isObjectMode ? item : item[props.valueField];

    emit("update:modelValue", value);
    emit("change", value);
    inputText.value = String(item[props.displayField] ?? "");
    closeDropdown();
    inputRef.value?.blur();
};

/**
 * clearValue — Xoá giá trị đang chọn và reset về full list.
 */
const clearValue = () => {
    inputText.value = "";
    emit("update:modelValue", null);
    emit("change", null);
    activeIndex.value = -1;
    inputRef.value?.focus();
    // Reset về full list
    props.store.loadData("", props.displayField);
};

// ─── Input Handlers ───────────────────────────────────────────────────────────

/**
 * onInput — Xử lý khi user gõ vào input.
 * Debounce trước khi gọi store.loadData.
 */
const onInput = (e: Event) => {
    const keyword = (e.target as HTMLInputElement).value;
    activeIndex.value = -1;

    if (!isOpen.value) isOpen.value = true;

    // Clear debounce cũ
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        if (keyword.length >= props.minChars) {
            props.store.loadData(keyword, props.displayField);
        }
        emit("search", keyword);
    }, props.debounceTime);
};

/**
 * onFocus — Khi input được focus.
 */
const onFocus = () => {
    isFocused.value = true;
    openDropdown();
};

/**
 * onBlur — Khi input mất focus.
 * Delay 150ms để click vào item trong dropdown không bị blur chặn.
 */
const onBlur = () => {
    isFocused.value = false;
    setTimeout(() => {
        // Kiểm tra focus còn trong rootRef không
        if (rootRef.value?.contains(document.activeElement)) return;
        closeDropdown();
        // Reset text về display của modelValue hiện tại
        inputText.value = getDisplayText(props.modelValue);
    }, 150);
};

// ─── Keyboard Navigation ──────────────────────────────────────────────────────

/**
 * onKeydown — Xử lý phím điều hướng.
 */
const onKeydown = (e: KeyboardEvent) => {
    const total = storeData.value.length;

    switch (e.key) {
        case "ArrowDown":
            e.preventDefault();
            if (!isOpen.value) {
                openDropdown();
            } else {
                activeIndex.value = Math.min(activeIndex.value + 1, total - 1);
            }
            break;

        case "ArrowUp":
            e.preventDefault();
            activeIndex.value = Math.max(activeIndex.value - 1, 0);
            break;

        case "Enter":
            e.preventDefault();
            if (activeIndex.value >= 0 && storeData.value[activeIndex.value]) {
                onSelect(storeData.value[activeIndex.value]);
            } else {
                openDropdown();
            }
            break;

        case "Escape":
            closeDropdown();
            inputText.value = getDisplayText(props.modelValue);
            break;

        case "Tab":
            closeDropdown();
            break;
    }
};

// ─── Click Outside ────────────────────────────────────────────────────────────

/**
 * handleClickOutside — Đóng dropdown khi click ra ngoài rootRef.
 */
const handleClickOutside = (e: MouseEvent) => {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
        closeDropdown();
        inputText.value = getDisplayText(props.modelValue);
    }
};

// ─── Watch ────────────────────────────────────────────────────────────────────

/**
 * Sync inputText khi modelValue thay đổi từ ngoài (vd: reset form).
 * immediate: true để init ngay lần đầu.
 */
watch(
    () => props.modelValue,
    (val) => {
        const text = getDisplayText(val);
        if (text !== inputText.value) inputText.value = text;
    },
    { immediate: true },
);

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
    document.addEventListener("mousedown", handleClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    if (debounceTimer) clearTimeout(debounceTimer);
    props.store.$dispose();
});
</script>

<style lang="scss" scoped>
// ─── SCSS Variables ────────────────────────────────────────────────────────────
$primary: #f48632;
$primary-alpha-20: rgba(244, 134, 50, 0.2);
$border-color: #d0d0d0;
$border-radius: 6px;
$input-height: 38px;

// ─── Root container ────────────────────────────────────────────────────────────

.cb-root {
    position: relative;
    display: inline-block;
    width: 100%;
    font-size: 14px;
    box-sizing: border-box;

    &--disabled {
        opacity: 0.5;
        pointer-events: none;
        cursor: not-allowed;
    }
}

// ─── Input wrapper ─────────────────────────────────────────────────────────────

.cb-input-wrap {
    display: flex;
    align-items: center;
    height: $input-height;
    border: 1px solid $border-color; // 1px — không phải 2px
    border-radius: $border-radius;
    background: #fff;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    overflow: hidden;

    // Hover
    &:hover {
        border-color: $primary;
    }

    // Focused state — thông qua parent modifier
    .cb-root--focused & {
        border-color: $primary;
        box-shadow: 0 0 0 3px $primary-alpha-20;
    }
}

// ─── Input ─────────────────────────────────────────────────────────────────────

.cb-input {
    flex: 1;
    height: 100%;
    padding: 0 10px;
    border: none;
    outline: none;
    background: transparent;
    font-size: inherit;
    color: inherit;
    font-family: inherit;
    min-width: 0;

    &::placeholder {
        color: #aaa;
    }

    &:disabled {
        cursor: not-allowed;
    }
}

// ─── Buttons (clear, toggle) ───────────────────────────────────────────────────

.cb-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    color: #999;
    transition: color 0.12s ease;

    &:hover {
        color: $primary;
    }

    &--clear {
        width: 24px;
        height: 24px;
        font-size: 18px;
        line-height: 1;
        border-radius: 50%;

        &:hover {
            background: rgba($primary, 0.08);
        }
    }

    &--toggle {
        width: 32px;
        height: 100%;
        border-left: 1px solid rgba($border-color, 0.6);
    }
}

// ─── Chevron icon ──────────────────────────────────────────────────────────────

.cb-chevron {
    transition: transform 0.2s ease;
    color: #666;

    &--open {
        transform: rotate(180deg);
    }
}

// ─── Dropdown panel ────────────────────────────────────────────────────────────

.cb-panel {
    position: absolute;
    top: calc(#{$input-height} + 4px); // cách input 4px — không liền mạch
    left: 0;
    right: 0;
    z-index: 1000;
    background: #fff;
    border: 1px solid $border-color; // xám — không dùng màu cam
    border-radius: $border-radius;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

// ─── Transition ────────────────────────────────────────────────────────────────

.cb-dropdown-enter-active,
.cb-dropdown-leave-active {
    transition:
        opacity 0.15s ease,
        transform 0.15s ease;
}

.cb-dropdown-enter-from,
.cb-dropdown-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>
