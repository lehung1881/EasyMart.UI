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
        <label v-if="label" class="cb-label">{{ label }}</label>

        <div ref="controlRef" class="cb-control">
            <div class="cb-input-wrap" :title="visibleText || undefined">
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

                <button v-if="hasClearValue" class="cb-btn cb-btn--clear" type="button" @mousedown.prevent="clearValue">
                    <div class="icon-close-small"></div>
                </button>

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

                <button
                    class="cb-btn cb-btn--add"
                    type="button"
                    tabindex="-1"
                    :disabled="disabled"
                    :readonly="!searchable"
                    v-if="quickAddEnabled"
                >
                    <div class="icon-add-16"></div>
                </button>
            </div>
        </div>
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
                        <template v-for="(_, name) in $slots" #[name]="slotData">
                            <slot :name="name" v-bind="slotData ?? {}" />
                        </template>
                    </BaseComboboxDropdown>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import type { PropType } from "vue";
import BaseComboboxDropdown from "@/components/controls/BaseComboboxDropdown.vue";
import type { ComboboxStoreInstance } from "@/composables/controls/useComboboxStore";

// Types
type ComboboxSize = "sm" | "md" | "lg";

export default defineComponent({
    name: "BaseCombobox",
    components: {
        BaseComboboxDropdown,
    },
    props: {
        /** v-model value — object hoặc primitive */
        modelValue: {
            type: [String, Number, Object] as PropType<string | number | Record<string, any> | null>,
            default: null,
        },
        /** Nhãn hiển thị phía trên input */
        label: {
            type: String,
            default: "",
        },
        /** Instance từ useComboboxStore() */
        store: {
            type: Object as PropType<ComboboxStoreInstance>,
            required: true,
        },
        /** Placeholder của input */
        placeholder: {
            type: String,
            default: "",
        },
        /** Vô hiệu hoá component */
        disabled: {
            type: Boolean,
            default: false,
        },
        /** Debounce thời gian gõ (ms) */
        debounceTime: {
            type: Number,
            default: 300,
        },
        /** Kích thước component — khớp với BaseInput size: 'sm' | 'md' | 'lg' */
        size: {
            type: String as PropType<ComboboxSize>,
            default: "md",
        },
        /** Số ký tự tối thiểu để trigger search */
        minChars: {
            type: Number,
            default: 0,
        },
        /** Hiển thị nút × để xoá giá trị đang chọn. default: false */
        clearIcon: {
            type: Boolean,
            default: false,
        },
        /**
         * Text hiển thị khi data chưa load xong hoặc giá trị nằm ở trang chưa fetch.
         * Tạo cảm giác có dữ liệu ngay từ đầu, tự động bị thay thế khi resolve được display text.
         */
        initText: {
            type: String,
            default: "",
        },
        /**
         * Tự động load data ngay khi component mount.
         * Hữu ích cho local mode hoặc khi muốn pre-fetch trước khi user mở dropdown.
         * default: false
         */
        autoLoad: {
            type: Boolean,
            default: true,
        },
        quickAddEnabled: {
            type: Boolean,
            default: false,
        },
        /**
         * Cho phép gõ để tìm kiếm trong dropdown.
         * false → input không gõ được, dropdown vẫn mở và chọn bình thường.
         * default: true
         */
        searchable: {
            type: Boolean,
            default: true,
        },
        /** Số item tối đa hiển thị trước khi scroll. default: 6 */
        maxDisplayItem: {
            type: Number,
            default: 6,
        },
        /**
         * Hàm custom để override text hiển thị trong input.
         */
        customDisplayText: {
            type: Function as PropType<(selectedItem: any) => string>,
            default: undefined,
        },
        /**
         * lvhung - 06.07.2026
         * Dữ liệu dòng hiện tại, dùng để truyền vào combobox trong bảng.
         */
        dataRow: {
            type: Object as PropType<any>,
            default: undefined,
        },
    },
    emits: ["update:modelValue", "change", "selected", "before-selected", "search"],
    setup(props, { emit }) {
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
         */
        const storeData = computed<Array<any>>(() => props.store.data ?? []);

        /** Có giá trị để hiển thị nút clear hay không */
        const hasClearValue = computed(() => props.clearIcon && inputText.value && !props.disabled);

        /**
         * visibleText — Text hiển thị trong input.
         * Ưu tiên: inputText (đã resolve) → initText (fallback khi chưa load) → ''
         * Không áp dụng initText khi đang focus để tránh che keyword search.
         */
        const visibleText = computed(() => {
            const baseText = (() => {
                if (props.customDisplayText && props.store.selectedItem) {
                    return props.customDisplayText(props.store.selectedItem);
                }
                return inputText.value;
            })();
            return baseText || isFocused.value ? baseText : (props.initText ?? "");
        });

        /** Class size — khớp pattern với BaseInput */
        const sizeClass = computed(() => `cb-root--${props.size}`);

        // Helpers

        /**
         * Set selectedItem trong store dựa trên modelValue.
         * Dùng khi data load xong mà modelValue đã có sẵn (vd: reset form với value primitive).
         */
        const setSelectedItem = (value: any) => {
            const found = storeData.value.find((item) => item[valueField.value] === value || item === value);
            props.store.setSelectedItem(found ?? null);
        };

        /**
         * getDisplayText — Lấy text hiển thị từ modelValue.
         * null/undefined → ''
         * object         → value[displayField]
         * primitive      → tìm trong storeData
         */
        const getDisplayText = (value: typeof props.modelValue): string => {
            if (value == null) return "";
            if (typeof value === "object") return String((value as Record<string, any>)[displayField.value] ?? "");
            // Tìm trong storeData để lấy display text
            const found = storeData.value.find((item) => item[valueField.value] === value);
            if (found) return String(found[displayField.value]);
            // storeData rỗng = data chưa load xong → trả "" tránh hiện thô primitive
            return storeData.value.length > 0 ? String(value) : "";
        };

        /**
         * Tính toán vị trí fixed cho cb-panel dựa trên vị trí cb-control trong viewport.
         */
        const calcDropdownPosition = (): void => {
            if (!controlRef.value || !panelRef.value) return;

            const controlRect = controlRef.value.getBoundingClientRect();
            const panelRect = panelRef.value.getBoundingClientRect();
            const gap = 4;

            // ── Trục Y ──────────────────────────────────────────────
            const spaceBelow = window.innerHeight - controlRect.bottom;
            const spaceAbove = controlRect.top;
            const panelHeight = panelRect.height;

            const topPosition =
                spaceBelow >= panelHeight + gap
                    ? controlRect.bottom + gap
                    : spaceAbove >= panelHeight + gap
                      ? controlRect.top - panelHeight - gap
                      : controlRect.bottom + gap;

            // ── Trục X ──────────────────────────────────────────────
            const panelWidth = props.store.dropdownWidth || controlRect.width;
            const spaceRight = window.innerWidth - controlRect.left;

            // Nếu không đủ chỗ bên phải → căn phải panel với cạnh phải của control
            const leftPosition =
                spaceRight >= panelWidth ? controlRect.left : Math.max(0, controlRect.right - panelWidth);

            dropdownStyle.value = {
                top: `${topPosition}px`,
                left: `${leftPosition}px`,
                width: `${panelWidth}px`,
            };
        };

        /** closeDropdown — Đóng dropdown và reset activeIndex */
        const closeDropdown = () => {
            isOpen.value = false;
            activeIndex.value = -1;
        };

        /**
         * openDropdown — Mở dropdown và trigger load data.
         */
        const openDropdown = async () => {
            if (props.disabled) return;
            // Luôn load trước — không guard bằng isOpen
            loadDataCombobox("");
            if (isOpen.value) return; // guard UI
            isOpen.value = true;
            await nextTick();
            calcDropdownPosition();
        };

        /**
         * onSelect — Xử lý khi user chọn một item.
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
         * Load data cho combobox, dùng chung cho openDropdown() và onInput().
         * @param keyword
         */
        const loadDataCombobox = async (keyword: string): Promise<void> => {
            const options = {
                dataRow: props.dataRow,
            };
            await props.store.loadData(keyword, options);
        };

        /**
         * clearValue — Xoá giá trị đang chọn và reset về full list.
         */
        const clearValue = () => {
            inputText.value = "";
            confirmedDisplayText.value = "";
            props.store.setSelectedItem(null);
            emit("update:modelValue", null);
            emit("change", null, null);
            activeIndex.value = -1;
            inputRef.value?.focus();
            // Reset về full list
            loadDataCombobox("");
        };

        // Input Handlers

        /**
         * onInput — Xử lý khi user gõ vào input.
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
                    loadDataCombobox(keyword);
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
         */
        const onBlur = () => {
            isFocused.value = false;
            setTimeout(() => {
                // Kiểm tra focus còn trong rootRef không
                if (rootRef.value?.contains(document.activeElement)) return;
                if (!isOpen.value) return;
                closeDropdown();
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

        watch(storeData, () => {
            if (isFocused.value) return;
            const text = getDisplayText(props.modelValue);
            if (text && text !== inputText.value) {
                confirmedDisplayText.value = text;
                inputText.value = text;
            }
            setSelectedItem(props.modelValue);
        });

        const onWindowScroll = (e: Event): void => {
            if (!isOpen.value) return;
            if (panelRef.value && panelRef.value.contains(e.target as Node)) return;
            closeDropdown();
            inputText.value = confirmedDisplayText.value;
        };

        // Lifecycle

        onMounted(() => {
            document.addEventListener("click", handleClickOutside);
            window.addEventListener("scroll", onWindowScroll, { passive: true, capture: true });
            window.addEventListener("resize", closeDropdown, { passive: true });
            if (props.autoLoad) {
                loadDataCombobox("");
            }
        });

        onBeforeUnmount(() => {
            document.removeEventListener("click", handleClickOutside);
            window.removeEventListener("scroll", onWindowScroll, { capture: true });
            window.removeEventListener("resize", closeDropdown);
            if (debounceTimer) clearTimeout(debounceTimer);
            props.store.$dispose();
        });

        return {
            rootRef,
            controlRef,
            inputRef,
            panelRef,
            isOpen,
            isFocused,
            activeIndex,
            dropdownStyle,
            storeData,
            displayField,
            valueField,
            columns,
            hasClearValue,
            visibleText,
            sizeClass,
            onInput,
            onFocus,
            onBlur,
            onKeydown,
            clearValue,
            closeDropdown,
            openDropdown,
            onSelect,
        };
    },
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

    &--toggle,
    &--add {
        width: 32px;
        height: 100%;
    }

    &--add {
        border-left: 1px solid #ddd;
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
