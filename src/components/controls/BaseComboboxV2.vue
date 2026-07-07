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
                        :loading="loading"
                        :loading-more="loadingMore"
                        :has-more="hasMore"
                        :max-display-item="maxDisplayItem"
                        @select="onSelect"
                        @load-more="loadNextPage()"
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
import BaseComboboxDropdown from "./BaseComboboxDropdown.vue";
import { DataType, FilterOperator } from "@/constants";
import { FilterNodeType, LogicalOperator, type FilterCondition, type PagingRequest } from "@/models/common/paging";
import type BaseAPI from "@/api/baseAPI";
import type { ColumnDefinition } from "@/models/common/columnDefinition";

// Types
type ComboboxSize = "sm" | "md" | "lg";
type QueryMode = "local" | "remote";

type ModelConstructor = {
    new (data?: Record<string, unknown>): any;
    fromList(items: Record<string, unknown>[]): any[];
};

export default defineComponent({
    name: "BaseComboboxV2",
    components: {
        BaseComboboxDropdown,
    },
    props: {
        /** Hàm load data remote, nhận payload, trả về Promise<Array<any>> */
        loadData: {
            type: Function as PropType<(payload: PagingRequest) => Promise<Array<any>>>,
            default: undefined,
        },
        /** v-model value – object hoặc primitive */
        modelValue: {
            type: [String, Number, Object] as PropType<string | number | Record<string, any> | null>,
            default: null,
        },
        /** Nhãn hiển thị phía trên input */
        label: {
            type: String,
            default: "",
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
        /** Kích thước component – khớp với BaseInput size: 'sm' | 'md' | 'lg' */
        size: {
            type: String as PropType<ComboboxSize>,
            default: "md",
        },
        /** Số ký tự tối thiểu để trigger search */
        minChars: {
            type: Number,
            default: 0,
        },
        /** Hiển thị nút x để xoá giá trị đang chọn. default: false */
        clearIcon: {
            type: Boolean,
            default: false,
        },
        /** Text hiển thị khi data chưa load xong hoặc giá trị nằm ở trang chưa fetch. */
        initText: {
            type: String,
            default: "",
        },
        /** Tự động load data ngay khi component mount. default: true */
        autoLoad: {
            type: Boolean,
            default: true,
        },
        quickAddEnabled: {
            type: Boolean,
            default: false,
        },
        /** false -> input không gõ được, dropdown vẫn mở và chọn bình thường. default: true */
        searchable: {
            type: Boolean,
            default: true,
        },
        /** Số item tối đa hiển thị trước khi scroll. default: 6 */
        maxDisplayItem: {
            type: Number,
            default: 6,
        },
        /** Hàm custom để override text hiển thị trong input. */
        customDisplayText: {
            type: Function as PropType<(selectedItem: any) => string>,
            default: undefined,
        },
        /** Dữ liệu dòng hiện tại, dùng để truyền vào combobox trong bảng. */
        dataRow: {
            type: Object as PropType<any>,
            default: undefined,
        },
        /** Data tĩnh cho local mode. Có data + không queryMode -> tự local */
        data: {
            type: Array as PropType<Array<any>>,
            default: undefined,
        },
        /** Chế độ truy vấn. Không truyền -> tự suy từ data */
        queryMode: {
            type: String as PropType<QueryMode>,
            default: undefined,
        },
        /** Số bản ghi mỗi trang (remote mode). Default: 20 */
        pageSize: {
            type: Number,
            default: 20,
        },
        /** Tên view/table gửi BE trong payload */
        viewOrTableName: {
            type: String,
            default: "",
        },
        /** Danh sách field search (gộp thêm displayField khi build filter) */
        searchFields: {
            type: Array as PropType<string[]>,
            default: () => [],
        },
        /** Field hiển thị text trong input và dropdown */
        displayField: {
            type: String,
            required: true,
        },
        /** Field dùng làm value khi emit */
        valueField: {
            type: String,
            required: true,
        },
        /** Cột cho dropdown dạng bảng. Không truyền -> render dạng list */
        columns: {
            type: Array as PropType<ColumnDefinition[]>,
            default: undefined,
        },
        /** Độ rộng dropdown (px). Không truyền -> tự tính từ columns */
        dropdownWidth: {
            type: Number as PropType<number | null>,
            default: null,
        },
        /** Model của dòng dữ liệu */
        modelClass: {
            type: Object as PropType<ModelConstructor>,
            default: undefined,
        },
        /** Hàm tuỳ chỉnh dữ liệu local */
        customLocalData: {
            type: Function as PropType<(rawData: any, options: any) => Array<any>>,
            default: undefined,
        },
    },
    emits: ["update:modelValue", "change", "selected", "before-selected", "search", "load-data"],
    setup(props, { emit }) {
        // #region Refs – DOM
        const rootRef = ref<HTMLElement | null>(null);
        const inputRef = ref<HTMLInputElement | null>(null);
        const controlRef = ref<HTMLElement | null>(null);
        const panelRef = ref<HTMLElement | null>(null);
        const dropdownStyle = ref<{ top: any; left: string; width: string }>({
            top: "0px",
            left: "0px",
            width: "0px",
        });
        // #endregion

        // #region Refs – UI State
        const isOpen = ref(false);
        const isFocused = ref(false);
        const inputText = ref("");
        const confirmedDisplayText = ref("");
        const activeIndex = ref(-1);
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        // #endregion

        // #region Refs – Data State
        const data = ref<Array<any>>([]);
        const loading = ref<boolean>(false);
        const loadingMore = ref<boolean>(false);
        const hasMore = ref<boolean>(false);
        const selectedItem = ref<any>(null);
        const oldSelectedItem = ref<any>(null);
        const selectedValue = ref<any>(null);
        // #endregion

        // #region Refs – Internal
        const rawData = ref<Array<any>>([]);
        const currentPage = ref<number>(1);
        const currentTextSearch = ref<string>("");
        // #endregion

        // #region Computed
        const mode = computed<QueryMode>(() => props.queryMode ?? (props.data ? "local" : "remote"));
        const isRemoteMode = computed(() => mode.value === "remote");

        const configuredSearchFields = computed<Array<string>>(() => {
            const uniqueFields = new Set<string>();
            (props.searchFields ?? []).forEach((f) => {
                if (f.trim()) uniqueFields.add(f.trim());
            });
            return Array.from(uniqueFields);
        });

        const dropdownWidth = computed<number | null>(() => {
            if (props.dropdownWidth !== null) return props.dropdownWidth;
            return (props.columns ?? []).reduce((max, col) => {
                const colWidth = typeof col.width === "number" ? col.width : 0;
                return Math.max(max, colWidth);
            }, 0);
        });

        const storeData = computed<Array<any>>(() => data.value ?? []);
        const hasClearValue = computed(() => props.clearIcon && inputText.value && !props.disabled);

        const visibleText = computed(() => {
            const baseText =
                props.customDisplayText && selectedItem.value
                    ? props.customDisplayText(selectedItem.value)
                    : inputText.value;
            return baseText || isFocused.value ? baseText : (props.initText ?? "");
        });

        const sizeClass = computed(() => `cb-root--${props.size}`);
        // #endregion

        // #region Helpers
        /**
         * lvhung - 07.07.2026
         * Map danh sách raw object sang model instance nếu modelClass được truyền vào
         */
        const mapToModel = (rows: Array<any>): Array<any> => {
            if (!props.modelClass) return rows;
            return props.modelClass.fromList(rows) as unknown as Array<any>;
        };

        /**
         * lvhung - 07.07.2026
         * Tạo FilterCondition dạng OR theo danh sách searchFields và displayField với keyword hiện tại
         */
        const buildTextSearchFilter = (searchFields: Array<string>): FilterCondition | null => {
            const keyword = currentTextSearch.value.trim();
            if (!keyword) return null;

            const mergedFields = new Set<string>();
            searchFields.forEach((f) => {
                if (f.trim()) mergedFields.add(f.trim());
            });
            if (props.displayField.trim()) mergedFields.add(props.displayField.trim());
            if (mergedFields.size === 0) return null;

            return {
                NodeType: FilterNodeType.Group,
                LogicalOperator: LogicalOperator.Or,
                Children: Array.from(mergedFields).map((field) => ({
                    NodeType: FilterNodeType.Condition,
                    Property: field,
                    Value: keyword,
                    Operator: FilterOperator.Contains,
                    Operand: 2,
                    DataType: DataType.String,
                })),
            };
        };

        /**
         * lvhung - 07.07.2026
         * Tạo PagingRequest payload gửi lên BE cho remote mode theo trang và keyword hiện tại
         */
        const buildPayload = (pageIndex: number): PagingRequest => ({
            PageIndex: pageIndex,
            PageSize: props.pageSize ?? 20,
            Sort: [],
            Filter: buildTextSearchFilter(configuredSearchFields.value),
            Columns: "",
            ViewOrTableName: props.viewOrTableName ?? "",
            SelectedValue:
                selectedValue.value == null
                    ? null
                    : {
                          property: props.valueField,
                          value: selectedValue.value,
                          dataType: DataType.String,
                      },
        });

        /**
         * lvhung - 07.07.2026
         * Emit event load-data lên parent và chờ callback done trả về danh sách items
         */
        const requestRemoteData = (payload: PagingRequest): Promise<Array<any>> => {
            return new Promise((done) => {
                emit("load-data", payload, done);
            });
        };

        /**
         * lvhung - 07.07.2026
         * Lấy text hiển thị trong input từ modelValue – ưu tiên object, fallback tìm trong storeData
         */
        const getDisplayText = (value: typeof props.modelValue): string => {
            if (value == null) return "";
            if (typeof value === "object") return String((value as Record<string, any>)[props.displayField] ?? "");
            const found = storeData.value.find((item) => item[props.valueField] === value);
            if (found) return String(found[props.displayField]);
            return storeData.value.length > 0 ? String(value) : "";
        };

        /**
         * lvhung - 07.07.2026
         * Tính toán và cập nhật vị trí dropdown (top/left/width) dựa trên vị trí control và viewport
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

            const panelWidthVal = dropdownWidth.value || controlRect.width;
            const spaceRight = window.innerWidth - controlRect.left;

            const leftPosition =
                spaceRight >= panelWidthVal ? controlRect.left : Math.max(0, controlRect.right - panelWidthVal);

            dropdownStyle.value = {
                top: `${topPosition}px`,
                left: `${leftPosition}px`,
                width: `${panelWidthVal}px`,
            };
        };

        /**
         * lvhung - 07.07.2026
         * Đồng bộ inputText và confirmedDisplayText từ modelValue hiện tại khi storeData thay đổi
         */
        const syncDisplayFromModel = () => {
            const text = getDisplayText(props.modelValue);
            if (text && text !== inputText.value) {
                confirmedDisplayText.value = text;
                inputText.value = text;
            }
            setSelectedItem(props.modelValue);
        };
        // #endregion

        // #region Actions
        /**
         * lvhung - 07.07.2026
         * Load danh sách dữ liệu theo keyword – local thì filter rawData, remote thì gọi API trang 1
         */
        const loadData = async (keyword: string, options: any = null): Promise<void> => {
            const df = props.displayField;

            if (!isRemoteMode.value) {
                if (options && props.customLocalData) {
                    rawData.value = props.customLocalData(rawData.value, options);
                }
                if (!keyword || !df) {
                    data.value = [...rawData.value];
                } else {
                    const kw = keyword.toLowerCase();
                    data.value = rawData.value.filter((item) => String(item[df]).toLowerCase().includes(kw));
                }
                return;
            }

            if (!props.loadData) {
                console.warn("[BaseComboboxV2] Remote mode cần truyền prop loadData");
                return;
            }

            currentTextSearch.value = keyword;
            currentPage.value = 1;
            hasMore.value = false;

            loading.value = true;
            try {
                const result = await props.loadData(buildPayload(1));
                data.value = mapToModel(result);
                hasMore.value = result.length >= (props.pageSize ?? 20);
            } catch (err) {
                console.error("[BaseComboboxV2] loadData error:", err);
                data.value = [];
            } finally {
                loading.value = false;
            }
        };

        /**
         * lvhung - 07.07.2026
         * Load thêm trang tiếp theo trong remote mode và append vào data hiện tại
         */
        const loadNextPage = async (): Promise<void> => {
            if (!isRemoteMode.value || loadingMore.value || !hasMore.value) return;
            if (!props.loadData) return;

            const nextPage = currentPage.value + 1;
            loadingMore.value = true;
            try {
                const result = await props.loadData(buildPayload(nextPage));
                data.value = [...data.value, ...mapToModel(result)];
                currentPage.value = nextPage;
                hasMore.value = result.length >= (props.pageSize ?? 20);
            } catch (err) {
                console.error("[BaseComboboxV2] loadNextPage error:", err);
            } finally {
                loadingMore.value = false;
            }
        };

        /**
         * lvhung - 07.07.2026
         * Cập nhật selectedItem và selectedValue từ value hoặc object item truyền vào
         */
        const setSelectedItem = (valueOrItem: any): void => {
            let item: any = null;
            if (valueOrItem != null) {
                item =
                    typeof valueOrItem === "object"
                        ? valueOrItem
                        : (storeData.value.find((i) => i[props.valueField] === valueOrItem || i === valueOrItem) ??
                          null);
            }
            oldSelectedItem.value = selectedItem.value ? { ...selectedItem.value } : null;
            selectedItem.value = item;
            selectedValue.value = item && props.valueField ? item[props.valueField] : null;
        };

        /**
         * lvhung - 07.07.2026
         * Reset toàn bộ state data và selection về giá trị khởi tạo ban đầu
         */
        const reset = (): void => {
            data.value = [];
            rawData.value = [];
            loading.value = false;
            loadingMore.value = false;
            hasMore.value = false;
            currentPage.value = 1;
            currentTextSearch.value = "";
            selectedItem.value = null;
            oldSelectedItem.value = null;
            selectedValue.value = null;
        };

        /**
         * lvhung - 07.07.2026
         * Đóng dropdown và reset activeIndex về -1
         */
        const closeDropdown = (): void => {
            isOpen.value = false;
            activeIndex.value = -1;
        };

        /**
         * lvhung - 07.07.2026
         * Huỷ thao tác đang nhập, đóng dropdown và khôi phục inputText về giá trị đã confirm
         */
        const cancelEdit = (): void => {
            closeDropdown();
            inputText.value = confirmedDisplayText.value;
        };

        /**
         * lvhung - 07.07.2026
         * Mở dropdown, trigger loadData và tính lại vị trí panel sau nextTick
         */
        const openDropdown = async (): Promise<void> => {
            if (props.disabled) return;
            loadData("", { dataRow: props.dataRow });
            if (isOpen.value) return;
            isOpen.value = true;
            await nextTick();
            calcDropdownPosition();
        };
        // #endregion

        // #region Events
        /**
         * lvhung - 07.07.2026
         * Xử lý khi người dùng chọn một item từ dropdown, emit update:modelValue / change / selected
         */
        const onSelect = (item: any): void => {
            const isObjectMode = typeof props.modelValue === "object" && props.modelValue !== null;
            const value = isObjectMode ? item : item[props.valueField];

            const metaData = {
                newValue: item,
                oldValue: selectedItem.value,
                allowSelect: true,
            };

            emit("before-selected", metaData);

            if (metaData.allowSelect) {
                setSelectedItem(item);
                emit("update:modelValue", value);
                emit("change", item, value);
                emit("selected", item);
                const displayText = String(item[props.displayField] ?? "");
                confirmedDisplayText.value = displayText;
                inputText.value = displayText;
            }

            closeDropdown();
            inputRef.value?.blur();
        };

        /**
         * lvhung - 07.07.2026
         * Xoá giá trị đang chọn, reset input và emit null về parent
         */
        const clearValue = (): void => {
            inputText.value = "";
            confirmedDisplayText.value = "";
            setSelectedItem(null);
            emit("update:modelValue", null);
            emit("change", null, null);
            activeIndex.value = -1;
            inputRef.value?.focus();
            loadData("", { dataRow: props.dataRow });
        };

        /**
         * lvhung - 07.07.2026
         * Xử lý sự kiện input của người dùng, debounce 300ms trước khi trigger loadData
         */
        const onInput = (e: Event): void => {
            if (!props.searchable) return;
            const keyword = (e.target as HTMLInputElement).value;
            activeIndex.value = -1;

            if (!isOpen.value) isOpen.value = true;

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (keyword.length >= props.minChars) {
                    loadData(keyword, { dataRow: props.dataRow });
                }
                emit("search", keyword);
            }, 1000);
        };

        /**
         * lvhung - 07.07.2026
         * Xử lý sự kiện focus vào input, mở dropdown
         */
        const onFocus = (): void => {
            isFocused.value = true;
            openDropdown();
        };

        /**
         * lvhung - 07.07.2026
         * Xử lý sự kiện blur khỏi input, đóng dropdown nếu focus không còn trong root element
         */
        const onBlur = async (): Promise<void> => {
            isFocused.value = false;
            await nextTick();
            if (rootRef.value?.contains(document.activeElement)) return;
            if (!isOpen.value) return;
            cancelEdit();
        };

        /**
         * lvhung - 07.07.2026
         * Xử lý keyboard navigation: ArrowDown/Up di chuyển item, Enter chọn, Escape/Tab đóng dropdown
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
                    cancelEdit();
                    break;

                case "Tab":
                    closeDropdown();
                    break;
            }
        };

        /**
         * lvhung - 07.07.2026
         * Đóng dropdown khi người dùng click ra ngoài vùng root element
         */
        const handleClickOutside = (e: MouseEvent) => {
            if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
                if (!isOpen.value) return;
                cancelEdit();
            }
        };

        /**
         * lvhung - 07.07.2026
         * Đóng dropdown khi window scroll, bỏ qua scroll xảy ra bên trong panel dropdown
         */
        const onWindowScroll = (e: Event): void => {
            if (!isOpen.value) return;
            if (panelRef.value && panelRef.value.contains(e.target as Node)) return;
            cancelEdit();
        };
        // #endregion

        // #region Watchers
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
            syncDisplayFromModel();
        });

        watch(
            () => props.data,
            (newData) => {
                rawData.value = newData ? mapToModel([...newData]) : [];
                data.value = newData ? mapToModel([...newData]) : [];
            },
            { immediate: true },
        );
        // #endregion

        // #region Lifecycle
        onMounted(() => {
            document.addEventListener("click", handleClickOutside);
            window.addEventListener("scroll", onWindowScroll, { passive: true, capture: true });
            window.addEventListener("resize", closeDropdown, { passive: true });
            if (props.autoLoad) {
                loadData("", { dataRow: props.dataRow });
            }
        });

        onBeforeUnmount(() => {
            document.removeEventListener("click", handleClickOutside);
            window.removeEventListener("scroll", onWindowScroll, { capture: true });
            window.removeEventListener("resize", closeDropdown);
            if (debounceTimer) clearTimeout(debounceTimer);
        });
        // #endregion

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
            loading,
            loadingMore,
            hasMore,
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
            reset,
            loadData,
            loadNextPage,
            setSelectedItem,
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
