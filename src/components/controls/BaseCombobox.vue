<template>
    <div
        ref="rootRef"
        class="cb-root"
        :class="[
            sizeClass,
            {
                'cb-root--focused': isFocused,
                'cb-root--open': isOpen,
                'cb-root--disabled': disabled,
            },
        ]"
    >
        <!-- Label──-->
        <label v-if="label" class="cb-label">{{ label }}</label>

        <!-- Control: input + dropdown — position:relative tính từ đây -->
        <div ref="controlRef" class="cb-control">
            <!-- Input wrapper -->
            <div class="cb-input-wrap">
                <input
                    ref="inputRef"
                    :value="visibleText"
                    class="cb-input"
                    type="text"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :readonly="!searchable"
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
                <button v-if="hasClearValue" class="cb-btn cb-btn--clear" type="button" @mousedown.prevent="clearValue">
                    <div class="icon-close-small"></div>
                </button>

                <!-- Nút toggle (▼) — chevron xoay khi mở -->
                <button
                    class="cb-btn cb-btn--toggle"
                    type="button"
                    :aria-label="isOpen ? 'Đóng dropdown' : 'Mở dropdown'"
                    tabindex="-1"
                    :disabled="disabled"
                    :readonly="!searchable"
                    @mousedown.prevent="isOpen ? closeDropdown() : openDropdown()"
                >
                    <div class="icon-chevron-small" :class="{ 'cb-chevron--open': isOpen }"></div>
                </button>
            </div>
        </div>
        <!-- /cb-control -->
        <!-- Dropdown panel -->
        <Teleport to="body">
            <Transition name="cb-dropdown">
                <div v-if="isOpen" ref="panelRef" class="cb-panel" :style="dropdownStyle">
                    <BaseComboboxDropdown
                        :data="storeData"
                        :display-field="displayField"
                        :value-field="valueField"
                        :columns="columns"
                        :active-index="activeIndex"
                        :selected-value="modelValue"
                        :loading="store.loading"
                        :loading-more="store.loadingMore"
                        :has-more="store.hasMore"
                        :max-display-item="maxDisplayItem"
                        @select="onSelect"
                        @load-more="store.loadNextPage()"
                    >
                        <!-- Pass-through slots -->
                        <template v-for="(_, name) in $slots" #[name]="slotData">
                            <slot :name="name" v-bind="slotData ?? {}" />
                        </template>
                    </BaseComboboxDropdown>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import BaseComboboxDropdown from "@/components/controls/BaseComboboxDropdown.vue";
import type { ComboboxStoreInstance } from "@/composables/controls/useComboboxStore";

// Types
type ComboboxSize = "sm" | "md" | "lg";

// Props
const props = withDefaults(
    defineProps<{
        /** v-model value — object hoặc primitive */
        modelValue: string | number | Record<string, any> | null;
        /** Nhãn hiển thị phía trên input */
        label?: string;
        /** Instance từ useComboboxStore() */
        store: ComboboxStoreInstance;
        /** Placeholder của input */
        placeholder?: string;
        /** Vô hiệu hoá component */
        disabled?: boolean;
        /** Debounce thời gian gõ (ms) */
        debounceTime?: number;
        /** Kích thước component — khớp với BaseInput size: 'sm' | 'md' | 'lg' */
        size?: ComboboxSize;
        /** Số ký tự tối thiểu để trigger search */
        minChars?: number;
        /** Hiển thị nút × để xoá giá trị đang chọn. default: false */
        clearIcon?: boolean;
        /**
         * Text hiển thị khi data chưa load xong hoặc giá trị nằm ở trang chưa fetch.
         * Tạo cảm giác có dữ liệu ngay từ đầu, tự động bị thay thế khi resolve được display text.
         */
        initText?: string;
        /**
         * Tự động load data ngay khi component mount.
         * Hữu ích cho local mode hoặc khi muốn pre-fetch trước khi user mở dropdown.
         * default: false
         */
        autoLoad?: boolean;
        /**
         * Cho phép gõ để tìm kiếm trong dropdown.
         * false → input không gõ được, dropdown vẫn mở và chọn bình thường.
         * default: true
         */
        searchable?: boolean;
        /** Số item tối đa hiển thị trước khi scroll. default: 6 */
        maxDisplayItem?: number;
    }>(),
    {
        placeholder: "",
        label: "",
        disabled: false,
        size: "md",
        debounceTime: 300,
        minChars: 0,
        autoLoad: true,
        searchable: true,
        clearIcon: false,
        initText: "",
        maxDisplayItem: 6,
    },
);

// Emits

const emit = defineEmits<{
    /** v-model binding */
    (e: "update:modelValue", value: any): void;
    /** Side effects khi chọn */
    (e: "change", item: any, value: any): void;
    /** Sự kiện khi chọn một item */
    (e: "selected", item: any): void;
    /** Sự kiện trước khi chọn một item */
    (e: "before-selected", metaData: any): void;
    /** Mỗi lần trigger search */
    (e: "search", keyword: string): void;
}>();

const displayField = computed(() => props.store.displayField);
const valueField = computed(() => props.store.valueField);
const columns = computed(() => props.store.columns);

// Internal State

/** Ref tới root element để detect click outside */
const rootRef = ref<HTMLElement | null>(null);
/** Ref tới input element */
const inputRef = ref<HTMLInputElement | null>(null);
/** Ref tới cb-control để tính toán vị trí dropdown */
const controlRef = ref<HTMLElement | null>(null);
/** Style position cho cb-panel khi dùng fixed */
const dropdownStyle = ref<{ top: any; left: string; width?: string }>({
    top: "0px",
    left: "0px",
    width: "0px",
});

/** Ref tới panel element để kiểm tra click inside khi scroll */
const panelRef = ref<HTMLElement | null>(null);

/** Dropdown đang mở hay không */
const isOpen = ref(false);
/** Input đang được focus */
const isFocused = ref(false);
/** Text hiển thị trong input */
const inputText = ref("");
/**
 * Display text đã được confirm — chỉ cập nhật khi:
 * 1. User chọn item (onSelect)
 * 2. modelValue đổi từ ngoài (watch modelValue)
 * 3. storeData load xong và resolve được display text (watch storeData)
 * Dùng để revert inputText khi blur mà không phụ thuộc vào storeData đang filtered.
 */
const confirmedDisplayText = ref("");
/** Index item đang active (keyboard nav), -1 = không có */
const activeIndex = ref(-1);
/** Timer debounce */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Guard: luôn trả về array, không bao giờ undefined/null.
 * Pinia unwrap reactive khi access qua props nên không cần .value.
 */
const storeData = computed<Array<any>>(() => props.store.data ?? []);

/** Có giá trị để hiển thị nút clear hay không */
const hasClearValue = computed(() => props.clearIcon && inputText.value && !props.disabled);

/**
 * visibleText — Text hiển thị trong input.
 * Ưu tiên: inputText (đã resolve) → initText (fallback khi chưa load) → ''
 * Không áp dụng initText khi đang focus để tránh che keyword search.
 */
const visibleText = computed(() => (inputText.value || isFocused.value ? inputText.value : (props.initText ?? "")));

/** Class size — khớp pattern với BaseInput */
const sizeClass = computed(() => `cb-root--${props.size}`);

// Helpers

/**
 * Set selectedItem trong store dựa trên modelValue.
 * Dùng khi data load xong mà modelValue đã có sẵn (vd: reset form với value primitive).
 * @param value
 */
const setSelectedItem = (value: any) => {
    const found = storeData.value.find((item) => item[valueField.value] === value || item === value);
    props.store.setSelectedItem(found ?? null);
};

/**
 * getDisplayText — Lấy text hiển thị từ modelValue.
 * null/undefined → ''
 * object         → value[displayField]
 * primitive      → tìm trong storeData:
 *   - Tìm thấy                → displayField của item
 *   - Không thấy + data đã có → String(value)  (giá trị không tồn tại trong list)
 *   - Không thấy + data rỗng  → ''             (data chưa load, tránh flash primitive)
 */
const getDisplayText = (value: typeof props.modelValue): string => {
    if (value == null) return "";
    if (typeof value === "object") return String((value as Record<string, any>)[displayField.value] ?? "");
    // Tìm trong storeData để lấy display text
    const found = storeData.value.find((item) => item[valueField.value] === value);
    if (found) return String(found[displayField.value]);
    // storeData rỗng = data chưa load xong → trả "" tránh hiện thô primitive (vd: "1")
    // watch(storeData) sẽ re-resolve sau khi data về
    return storeData.value.length > 0 ? String(value) : "";
};

/**
 * calcDropdownPosition — Tính toán vị trí fixed cho cb-panel dựa trên
 * vị trí của cb-control trong viewport.
 * Gọi mỗi khi mở dropdown để đảm bảo vị trí luôn chính xác dù page đã scroll.
 */
const calcDropdownPosition = (): void => {
    if (!controlRef.value || !panelRef.value) return;

    const controlRect = controlRef.value.getBoundingClientRect();
    const panelRect = panelRef.value.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - controlRect.bottom;
    const spaceAbove = controlRect.top;
    const panelHeight = panelRect.height;

    const topPosition =
        spaceBelow >= panelHeight + gap
            ? controlRect.bottom + gap
            : spaceAbove >= panelHeight + gap
              ? controlRect.top - panelHeight - gap
              : controlRect.bottom + gap;

    dropdownStyle.value = {
        top: `${topPosition}px`,
        left: `${controlRect.left}px`,
        width: `${props.store.dropdownWidth ? props.store.dropdownWidth : controlRect.width}px`,
    };
};

/** closeDropdown — Đóng dropdown và reset activeIndex */
const closeDropdown = () => {
    isOpen.value = false;
    activeIndex.value = -1;
};

/**
 * openDropdown — Mở dropdown và trigger load data.
 * Luôn gọi store.loadData() trước khi check isOpen
 * để đảm bảo data luôn fresh kể cả khi dropdown đã mở.
 */
const openDropdown = async () => {
    if (props.disabled) return;
    // Luôn load trước — không guard bằng isOpen
    props.store.loadData("");
    if (isOpen.value) return; // guard UI
    isOpen.value = true;
    await nextTick();
    calcDropdownPosition();
};

/**
 * onSelect — Xử lý khi user chọn một item.
 * modelValue là object → emit nguyên item
 * modelValue là primitive → emit item[valueField]
 */
const onSelect = (item: any) => {
    const isObjectMode = typeof props.modelValue === "object" && props.modelValue !== null;
    const value = isObjectMode ? item : item[valueField.value];

    const metaData = {
        newValue: item,
        oldValue: props.store.selectedItem,
        allowSelect: true,
    };

    emit("before-selected", metaData);

    if (metaData.allowSelect) {
        props.store.setSelectedItem(item);
        emit("update:modelValue", value);
        emit("change", item, value);
        emit("selected", item);
        const displayText = String(item[displayField.value] ?? "");
        confirmedDisplayText.value = displayText;
        inputText.value = displayText;
    }

    closeDropdown();
    inputRef.value?.blur();
};

/**
 * clearValue — Xoá giá trị đang chọn và reset về full list.
 */
const clearValue = () => {
    inputText.value = "";
    confirmedDisplayText.value = "";
    props.store.setSelectedItem(null);
    emit("update:modelValue", null);
    emit("change", null);
    activeIndex.value = -1;
    inputRef.value?.focus();
    // Reset về full list
    props.store.loadData("");
};

// Input Handlers

/**
 * onInput — Xử lý khi user gõ vào input.
 * Debounce trước khi gọi store.loadData.
 */
const onInput = (e: Event) => {
    if (!props.searchable) return;
    const keyword = (e.target as HTMLInputElement).value;
    activeIndex.value = -1;

    if (!isOpen.value) isOpen.value = true;

    // Clear debounce cũ
    if (debounceTimer) clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        if (keyword.length >= props.minChars) {
            props.store.loadData(keyword);
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
        if (!isOpen.value) return;
        closeDropdown();
        // Revert về confirmed display text — không dùng getDisplayText vì storeData
        // vẫn đang ở trạng thái filtered, sẽ resolve sai (trả về "" hoặc raw primitive).
        inputText.value = confirmedDisplayText.value;
    }, 150);
};

// Keyboard Navigation

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
            }
            break;

        case "Escape":
            closeDropdown();
            inputText.value = confirmedDisplayText.value;
            break;

        case "Tab":
            closeDropdown();
            break;
    }
};

// Click Outside

/**
 * handleClickOutside — Đóng dropdown khi click ra ngoài rootRef.
 */
const handleClickOutside = (e: MouseEvent) => {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
        if (!isOpen.value) return;
        closeDropdown();
        inputText.value = confirmedDisplayText.value;
    }
};

// Watch

/**
 * Sync inputText khi modelValue thay đổi từ ngoài (vd: reset form).
 * immediate: true để init ngay lần đầu.
 */
watch(
    () => props.modelValue,
    (val) => {
        const text = getDisplayText(val);
        confirmedDisplayText.value = text;
        if (text !== inputText.value) inputText.value = text;

        setSelectedItem(val);
    },
    { immediate: true },
);

/**
 * Re-resolve inputText sau khi store.data load xong.
 *
 * Vấn đề: watch(modelValue, { immediate }) chạy TRƯỚC khi data được fetch
 * → getDisplayText không tìm thấy item → fallback về String(primitiveValue).
 *
 * Fix: mỗi lần storeData thay đổi (data về), nếu modelValue đang là primitive
 * và inputText chưa đúng display text → re-resolve lại.
 * Không chạy khi user đang gõ (isFocused) để tránh ghi đè keyword search.
 */
watch(storeData, () => {
    if (isFocused.value) return;
    const text = getDisplayText(props.modelValue);
    if (text && text !== inputText.value) {
        confirmedDisplayText.value = text;
        inputText.value = text;
    }
    // Set selectedItem khi data load xong mà modelValue đã có sẵn
    setSelectedItem(props.modelValue);
});

/**
 * onWindowScroll — Đóng dropdown khi scroll xảy ra bên ngoài cb-panel.
 * Dùng capture: true để bắt được scroll trên mọi container, nhưng
 * bỏ qua nếu event xuất phát từ bên trong panel (list/tbody cuộn nội bộ).
 */
const onWindowScroll = (e: Event): void => {
    if (!isOpen.value) return;
    if (panelRef.value && panelRef.value.contains(e.target as Node)) return;
    closeDropdown();
    inputText.value = confirmedDisplayText.value;
};

// Lifecycle

onMounted(() => {
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", onWindowScroll, { passive: true, capture: true });
    window.addEventListener("resize", closeDropdown, { passive: true });
    // autoLoad: pre-fetch data ngay khi mount, không cần chờ user mở dropdown
    if (props.autoLoad) {
        props.store.loadData("");
    }
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    window.removeEventListener("scroll", onWindowScroll, { capture: true });
    window.removeEventListener("resize", closeDropdown);
    if (debounceTimer) clearTimeout(debounceTimer);
    props.store.$dispose();
});
</script>

<style lang="scss" scoped>
.cb-root {
    display: inline-block;
    width: 100%;
    box-sizing: border-box;

    &--sm {
        --cb-input-height: #{$input-height-sm};
    }
    &--md {
        --cb-input-height: #{$input-height-md};
    }
    &--lg {
        --cb-input-height: #{$input-height-lg};
    }

    &--disabled {
        opacity: 0.5;
        pointer-events: none;
        cursor: not-allowed;
    }
}

.cb-control {
    width: 100%;
}

.cb-label {
    display: block;
    margin-bottom: 10px;
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    color: $color-text-black;
    line-height: 1;
}

.cb-input-wrap {
    display: flex;
    align-items: center;
    height: var(--cb-input-height);
    border: $input-border;
    border-radius: $control-border-radius;
    background: #fff;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
    overflow: hidden;

    &:hover {
        border-color: $primary-color;
    }

    .cb-root--focused & {
        border-color: $primary-color;
    }
}

.cb-input {
    flex: 1;
    height: 100%;
    padding: 0 10px;
    border: none;
    outline: none;
    background: transparent;
    font-size: $font-size-base;
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
        color: $primary-color;
    }

    &--clear {
        width: 24px;
        height: 24px;
        font-size: 18px;
        line-height: 1;
        border-radius: 50%;

        &:hover {
            background: rgba($primary-color, 0.08);
        }
    }

    &--toggle {
        width: 32px;
        height: 100%;
        // .icon-chevron-small {
        //     border-radius: 50%;
        //     &:hover {
        //         background: rgba($primary-color, 0.08);
        //     }
        // }
        // border-left: 1px solid rgba($border-color, 0.6);
    }
}

.cb-chevron {
    transition: transform 0.2s ease;
    color: #666;

    &--open {
        transform: rotate(180deg);
    }
}

.cb-panel {
    position: fixed;
    z-index: 1000;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: $control-border-radius;
    box-shadow: 0 0 10px #0000002d;
    overflow: hidden;
}

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
