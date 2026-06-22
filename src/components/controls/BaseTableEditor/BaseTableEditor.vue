<template>
    <div class="tb-root" :class="{ 'tb-root--disabled': disabled }">
        <div class="tb-root__wrapper overflow-auto" :class="{ 'tb-root__wrapper--no-pagination': !showPagination }">
            <table class="tb-root__table">
                <BaseTableEditorHeader
                    :columns="columns"
                    :show-selection="showSelection"
                    :show-row-action="showRowAction"
                    :all-selected="allCurrentPageSelected"
                    :show-serial="showSerial"
                    @toggle-all="onToggleAllCurrentPage"
                >
                    <template v-for="(_, name) in $slots" #[name]="slotData">
                        <slot :name="name" v-bind="slotData ?? {}" />
                    </template>
                </BaseTableEditorHeader>

                <BaseTableEditorContent
                    :data="pagedRows"
                    :columns="columns"
                    :selected-rows="localSelectedRows"
                    :row-key="rowKey"
                    :editing-row-key="editingRowKey"
                    :loading="false"
                    :empty-text="emptyText"
                    :show-selection="showSelection"
                    :show-row-action="showRowAction"
                    :list-row-action="listRowAction"
                    :editor-props="editorProps"
                    :page-size="selectedPageSize"
                    :show-serial="showSerial"
                    @row-click="onRowClick"
                    @toggle-row="onToggleRow"
                    @row-action-click="onRowAction"
                    @focus="onEditorFocus"
                    @blur="onEditorBlur"
                    @change="onEditorChange"
                    @input="onEditorInput"
                    @before-selected="onEditorBeforeSelected"
                    @selected="onEditorSelected"
                    @search="onEditorSearch"
                >
                    <template v-for="(_, name) in $slots" #[name]="slotData">
                        <slot :name="name" v-bind="slotData ?? {}" />
                    </template>
                </BaseTableEditorContent>
            </table>
        </div>

        <div v-if="showPagination" class="tb-pagination">
            <div class="tb-pagination__label">
                Tổng số: <span>{{ totalRecords }}</span>
            </div>
            <div class="tb-pagination__controls">
                <div class="tb-pagination__left">
                    <span class="tb-pagination__label">Số dòng/trang</span>
                    <div class="tb-pagination__page-size-combobox">
                        <BaseCombobox
                            v-model="selectedPageSize"
                            :store="pageSizeStore"
                            :searchable="false"
                            :auto-load="true"
                            size="sm"
                        />
                    </div>
                    <span class="tb-pagination__range">{{ rowRangeText }}</span>
                </div>
                <div class="tb-pagination__nav">
                    <button class="tb-pagination__btn" type="button" :disabled="!canGoPrev" @click="onGoFirst">
                        <div class="icon-page-first"></div>
                    </button>
                    <button class="tb-pagination__btn" type="button" :disabled="!canGoPrev" @click="onGoPrev">
                        <div class="icon-page-prev"></div>
                    </button>
                    <button class="tb-pagination__btn" type="button" :disabled="!canGoNext" @click="onGoNext">
                        <div class="icon-page-next"></div>
                    </button>
                    <button class="tb-pagination__btn" type="button" :disabled="!canGoNext" @click="onGoLast">
                        <div class="icon-page-last"></div>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, reactive, ref, watch } from "vue";
import BaseCombobox from "@/components/controls/BaseCombobox.vue";
import BaseTableEditorHeader from "@/components/controls/BaseTableEditor/BaseTableEditorHeader.vue";
import BaseTableEditorContent, {
    type TableRowAction,
} from "@/components/controls/BaseTableEditor/BaseTableEditorContent.vue";
import { useComboboxStore } from "@/composables/controls/useComboboxStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import commonFunction from "@/commons/commonFunction";
import type BaseModel from "@/models/common/baseModel";

export type TableRow = Record<string, unknown>;

interface PageSizeOption {
    label: string;
    value: number;
}

/** Constructor của class kế thừa BaseModel, có hỗ trợ tạo hàng loạt qua fromList */
type ModelConstructor = {
    new (data?: Record<string, unknown>): BaseModel;
    fromList(items: Record<string, unknown>[]): BaseModel[];
};

export default defineComponent({
    name: "BaseTableEditor",

    components: {
        BaseCombobox,
        BaseTableEditorHeader,
        BaseTableEditorContent,
    },

    props: {
        /** Dữ liệu mảng các dòng trong bảng */
        modelValue: { type: Array as () => TableRow[], required: true },
        /** Cấu hình danh sách các cột của bảng */
        columns: { type: Array as () => ColumnDefinition[], required: true },
        /** Tên trường khóa chính của dòng dữ liệu */
        rowKey: { type: String, default: "id" },
        /** Trạng thái disable toàn bộ bảng */
        disabled: { type: Boolean, default: false },
        /** Văn bản hiển thị khi không có dữ liệu */
        emptyText: { type: String, default: "Không có dữ liệu" },
        /** Hiển thị cột checkbox để chọn nhiều dòng hay không */
        showSelection: { type: Boolean, default: true },
        /** Hiển thị cột chứa các hành động của dòng hay không */
        showRowAction: { type: Boolean, default: true },
        /** Danh sách các hành động có thể thực hiện trên từng dòng */
        listRowAction: { type: Array as () => TableRowAction[], default: () => [] },
        /** Dữ liệu mặc định khi thêm một dòng mới */
        defaultDataAddRow: { type: Object as () => TableRow, default: undefined },
        /** Props bổ sung truyền cho component editor nội bộ */
        editorProps: { type: Object, default: () => ({}) },
        /** Hiển thị thanh phân trang hay không */
        showPagination: { type: Boolean, default: true },
        /** Danh sách các tùy chọn số lượng dòng trên một trang */
        pageSizeOptions: { type: Array as () => number[], default: () => [10, 20, 30, 50, 100] },
        /** Hiển thị cột số thứ tự tăng dần hay không */
        showSerial: { type: Boolean, default: false },
        /** Class kế thừa BaseModel dùng để ép kiểu các dòng dữ liệu chưa phải instance model */
        modelClass: { type: Function as unknown as () => ModelConstructor, default: undefined },
    },

    emits: [
        "update:modelValue",
        "row-click",
        "row-action-click",
        "update:selectedRows",
        "beforeAddRow",
        "beforeRemoveRow",
        "focus",
        "blur",
        "change",
        "input",
        "before-selected",
        "selected",
        "search",
        "page-change",
        "page-size-change",
    ],

    setup(props, { emit, expose }) {
        /** Danh sách các dòng đang được chọn lưu trữ cục bộ */
        const localSelectedRows = ref<TableRow[]>([]);
        /** Khóa (ID) của dòng đang trong trạng thái chỉnh sửa */
        const editingRowKey = ref<string | number | null>(null);
        /** Số lượng dòng hiển thị trên một trang đang được chọn */
        const selectedPageSize = ref<number>(20);
        /** Số thứ tự trang hiện tại */
        const currentPage = ref<number>(1);

        /**
         * Lấy giá trị khóa chính (ID) của một dòng dựa vào thuộc tính `rowKey`.
         * @param row Đối tượng dữ liệu của dòng
         * @returns Giá trị key (chuỗi hoặc số)
         */
        const getRowKeyValue = (row: TableRow): string | number => row[props.rowKey] as string | number;

        /**
         * Xác định kích thước trang mặc định khi khởi tạo.
         * Ưu tiên chọn giá trị 20, nếu không tìm thấy sẽ lấy phần tử đầu tiên của mảng options.
         * Trường hợp tắt phân trang, trả về giá trị lớn (1000).
         * @returns Kích thước trang mặc định
         */
        const getDefaultPageSize = (): number => {
            if (!props.showPagination) return 1000;
            if (props.pageSizeOptions.includes(20)) return 20;
            return props.pageSizeOptions[0] ?? 20;
        };

        /**
         * Ép một dòng dữ liệu thô về instance của modelClass nếu chưa phải instance.
         * Nếu không cấu hình modelClass hoặc dòng đã là instance model thì giữ nguyên.
         * @param row Dữ liệu dòng cần kiểm tra/ép kiểu
         * @returns Instance model tương ứng hoặc dòng gốc
         */
        const ensureModelInstance = (row: TableRow): TableRow => {
            if (!props.modelClass) return row;
            if (row instanceof props.modelClass) return row;
            return new props.modelClass(row) as unknown as TableRow;
        };

        // ==========================================
        // COMPUTED PROPERTIES
        // ==========================================

        /** Danh sách dòng đã đảm bảo là instance của modelClass (nếu có cấu hình) */
        const normalizedRows = computed<TableRow[]>(() => {
            if (!props.modelClass) return props.modelValue;
            return props.modelValue.map(ensureModelInstance);
        });

        /** Tính tổng số lượng bản ghi hiện có trong bảng */
        const totalRecords = computed<number>(() => normalizedRows.value.length);

        /** Tính toán tổng số trang dựa trên tổng số bản ghi và kích thước trang */
        const totalPages = computed<number>(() => {
            if (selectedPageSize.value <= 0) return 1;
            const pages = Math.ceil(totalRecords.value / selectedPageSize.value);
            return pages > 0 ? pages : 1;
        });

        /** Cắt lát dữ liệu nguồn (đã chuẩn hóa model) để lấy danh sách các dòng hiển thị cho trang hiện tại */
        const pagedRows = computed<TableRow[]>(() => {
            const startIndex = (currentPage.value - 1) * selectedPageSize.value;
            return normalizedRows.value.slice(startIndex, startIndex + selectedPageSize.value);
        });

        /** Kiểm tra xem tất cả các dòng ở trang hiện tại đã được chọn hết hay chưa */
        const allCurrentPageSelected = computed<boolean>(() => {
            if (!props.showSelection || pagedRows.value.length === 0) return false;
            return pagedRows.value.every((row) =>
                localSelectedRows.value.some((selectedRow) => getRowKeyValue(selectedRow) === getRowKeyValue(row)),
            );
        });

        /** Điều kiện cho phép bấm quay lại trang trước (Trang hiện tại phải lớn hơn 1) */
        const canGoPrev = computed<boolean>(() => currentPage.value > 1);
        /** Điều kiện cho phép bấm sang trang tiếp theo (Trang hiện tại phải nhỏ hơn tổng số trang) */
        const canGoNext = computed<boolean>(() => currentPage.value < totalPages.value);

        /** Chuỗi văn bản hiển thị dải dữ liệu hiện tại (Ví dụ: "1 - 20") */
        const rowRangeText = computed<string>(() => {
            if (totalRecords.value === 0) return "0 - 0";
            const start = (currentPage.value - 1) * selectedPageSize.value + 1;
            const end = Math.min(currentPage.value * selectedPageSize.value, totalRecords.value);
            return `${start} - ${end}`;
        });

        /** Chuyển đổi mảng số lượng trang từ props thành mảng object phù hợp cấu trúc dữ liệu Combobox */
        const pageSizeData = computed<PageSizeOption[]>(() =>
            props.pageSizeOptions.map((size) => ({ label: String(size), value: size })),
        );

        /** Khởi tạo và quản lý store cục bộ cho combobox chọn Page Size */
        const pageSizeStore = useComboboxStore("table_editor_page_size", {
            queryMode: "local",
            data: pageSizeData.value,
            comboboxLoadData: async () => [],
            displayField: "label",
            valueField: "value",
        });

        // ==========================================
        // ACTIONS / METHODS
        // ==========================================

        /**
         * Xử lý sự kiện khi click chọn/bỏ chọn checkbox của một dòng đơn lẻ.
         * @param payload Đối tượng chứa thông tin dòng và trạng thái checked
         */
        const onToggleRow = (payload: { row: TableRow; checked: boolean }): void => {
            const key = getRowKeyValue(payload.row);
            if (payload.checked) {
                if (!localSelectedRows.value.some((row) => getRowKeyValue(row) === key)) {
                    localSelectedRows.value.push(payload.row);
                }
            } else {
                localSelectedRows.value = localSelectedRows.value.filter((row) => getRowKeyValue(row) !== key);
            }
            emit("update:selectedRows", [...localSelectedRows.value]);
        };

        /**
         * Xử lý sự kiện khi click chọn/bỏ chọn checkbox "Tất cả" tại Header (áp dụng riêng cho trang hiện tại).
         * @param checked Trạng thái chọn tất cả hay bỏ chọn tất cả
         */
        const onToggleAllCurrentPage = (checked: boolean): void => {
            if (checked) {
                const selectedRowMap = new Map(localSelectedRows.value.map((row) => [getRowKeyValue(row), row]));
                pagedRows.value.forEach((row) => selectedRowMap.set(getRowKeyValue(row), row));
                localSelectedRows.value = Array.from(selectedRowMap.values());
            } else {
                const currentPageKeys = new Set(pagedRows.value.map((row) => getRowKeyValue(row)));
                localSelectedRows.value = localSelectedRows.value.filter(
                    (row) => !currentPageKeys.has(getRowKeyValue(row)),
                );
            }
            emit("update:selectedRows", [...localSelectedRows.value]);
        };

        /**
         * Xử lý sự kiện khi click trực tiếp vào một dòng dữ liệu.
         * Kích hoạt trạng thái inline-edit cho dòng đó.
         * @param payload Đối tượng chứa thông tin dòng và index của dòng đó
         */
        const onRowClick = (payload: { row: TableRow; index: number }): void => {
            editingRowKey.value = getRowKeyValue(payload.row);
            emit("row-click", payload);
        };

        /**
         * Thực hiện xóa một dòng ra khỏi dữ liệu bảng sau khi đã qua bước kiểm tra điều kiện.
         * @param row Đối tượng dòng dữ liệu cần xóa
         */
        const removeRow = (row: TableRow): void => {
            const metaData = { row, allowDelete: true };
            emit("beforeRemoveRow", metaData);

            if (metaData.allowDelete) {
                const key = getRowKeyValue(row);
                // Lọc bỏ dòng bị xóa khỏi mảng tổng và mảng đang được chọn
                const newRows = props.modelValue.filter((r) => getRowKeyValue(r) !== key);
                localSelectedRows.value = localSelectedRows.value.filter((r) => getRowKeyValue(r) !== key);

                // Nếu dòng đang xóa trùng với dòng đang edit thì hủy trạng thái edit
                if (editingRowKey.value === key) editingRowKey.value = null;

                emit("update:modelValue", newRows);
            }
        };

        /**
         * Tiếp nhận và xử lý các hành động tác vụ (Action) trên dòng (ví dụ: Sửa, Xóa...).
         * @param action Tên định nghĩa hành động hành động
         * @param row Dữ liệu dòng đang chịu tác động
         */
        const onRowAction = (action: TableRowAction, row: TableRow): void => {
            if (action.actionName.trim().toLowerCase() === "delete") removeRow(row);
            emit("row-action-click", action, row);
        };

        // Bắt và chuyển tiếp (forward) các sự kiện tương tác từ các component ô nhập liệu (Editor) bên trong ô bảng ra bên ngoài
        const onEditorFocus = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("focus", row, column, ...args);
        const onEditorBlur = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("blur", row, column, ...args);
        const onEditorChange = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("change", row, column, ...args);
        const onEditorInput = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("input", row, column, ...args);
        const onEditorBeforeSelected = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("before-selected", row, column, ...args);
        const onEditorSelected = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("selected", row, column, ...args);
        const onEditorSearch = (row: TableRow, column: ColumnDefinition, ...args: unknown[]) =>
            emit("search", row, column, ...args);

        /** Điều hướng phân trang: Chuyển về trang đầu tiên */
        const onGoFirst = (): void => {
            currentPage.value = 1;
            emit("page-change", currentPage.value);
        };
        /** Điều hướng phân trang: Quay về trang liền trước */
        const onGoPrev = (): void => {
            if (!canGoPrev.value) return;
            currentPage.value -= 1;
            emit("page-change", currentPage.value);
        };
        /** Điều hướng phân trang: Chuyển tới trang kế tiếp */
        const onGoNext = (): void => {
            if (!canGoNext.value) return;
            currentPage.value += 1;
            emit("page-change", currentPage.value);
        };
        /** Điều hướng phân trang: Tiến thẳng tới trang cuối cùng */
        const onGoLast = (): void => {
            currentPage.value = totalPages.value;
            emit("page-change", currentPage.value);
        };

        /**
         * Thêm một dòng mới vào cuối bảng với cấu trúc dữ liệu ngầm định.
         * Nếu có cấu hình modelClass và defaultDataAddRow chưa phải instance model, dòng mới sẽ được khởi tạo qua modelClass.
         * Nếu defaultDataAddRow đã là instance model sẵn thì giữ nguyên, không tạo lại.
         * Tự động sinh ID theo chuẩn GUID V7 và tự động chuyển phân trang đến trang cuối cùng chứa dòng vừa tạo.
         */
        const addRow = (): void => {
            if (!props.defaultDataAddRow) return;

            let newRecord: TableRow;

            if (props.modelClass && props.defaultDataAddRow instanceof props.modelClass) {
                // Đã là instance model sẵn, không tạo lại — chỉ sinh ID mới
                newRecord = props.defaultDataAddRow;
                newRecord[props.rowKey] = commonFunction.generateGUIDV7();
            } else {
                const rawRecord: TableRow = { ...props.defaultDataAddRow };
                rawRecord[props.rowKey] = commonFunction.generateGUIDV7();
                newRecord = props.modelClass
                    ? reactive(new props.modelClass(rawRecord) as unknown as TableRow)
                    : reactive(rawRecord);
            }

            const metaData = { row: newRecord, allowInsert: true };
            emit("beforeAddRow", metaData);

            if (metaData.allowInsert) {
                editingRowKey.value = getRowKeyValue(newRecord);
                const nextTotal = props.modelValue.length + 1;
                // Tính toán để tự động nhảy đến trang cuối cùng sau khi chèn
                currentPage.value = Math.max(1, Math.ceil(nextTotal / selectedPageSize.value));
                emit("update:modelValue", [...props.modelValue, newRecord]);
                emit("page-change", currentPage.value);
            }
        };

        /** Xóa toàn bộ tất cả các dòng hiện có trong bảng dữ liệu */
        const removeAllRow = (): void => {
            emit("update:modelValue", []);
        };

        /**
         * Cập nhật lại thông tin của một dòng dựa trên ID (`rowKey`).
         * @param row Đối tượng chứa thông tin dòng với các giá trị mới cần cập nhật
         */
        const updateRow = (row: TableRow): void => {
            const key = getRowKeyValue(row);
            const newRows = props.modelValue.map((r) => (getRowKeyValue(r) === key ? { ...r, ...row } : r));
            emit("update:modelValue", newRows);
        };

        /** Làm trống danh sách các dòng đang được tích chọn (Clear checkbox) */
        const clearSelection = (): void => {
            localSelectedRows.value = [];
        };

        // ==========================================
        // WATCHERS (THEO DÕI BIẾN)
        // ==========================================

        /** Theo dõi sự thay đổi của cấu hình tùy chọn số lượng dòng trên trang để tái cấu trúc store cho Combobox */
        watch(
            pageSizeData,
            (nextData) => {
                pageSizeStore.initConfigStore({
                    queryMode: "local",
                    data: nextData,
                    comboboxLoadData: async () => [],
                    displayField: "label",
                    valueField: "value",
                });
                pageSizeStore.loadData("");
            },
            { immediate: true },
        );

        /** Theo dõi khi người dùng thay đổi số dòng/trang. Thiết lập quay lại trang 1 để tránh lỗi lệch index */
        watch(selectedPageSize, (nextPageSize) => {
            if (!props.pageSizeOptions.includes(nextPageSize)) {
                selectedPageSize.value = getDefaultPageSize();
                return;
            }
            currentPage.value = 1;
            emit("page-size-change", selectedPageSize.value);
            emit("page-change", currentPage.value);
        });

        /** Theo dõi biến động số lượng bản ghi tổng thể nhằm điều chỉnh vị trí trang hiện tại cho hợp lệ */
        watch(
            () => props.modelValue.length,
            () => {
                if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
                if (currentPage.value < 1) currentPage.value = 1;
                emit("page-change", currentPage.value);
            },
            { immediate: true },
        );

        // ==========================================
        // LIFECYCLE HOOKS
        // ==========================================

        // Khởi tạo kích thước trang ban đầu khi component được mount
        selectedPageSize.value = getDefaultPageSize();

        // Hủy liên kết và giải phóng bộ nhớ của Pinia Store trước khi component bị tiêu hủy
        onBeforeUnmount(() => pageSizeStore.$dispose());

        // Xuất (Expose) công khai các phương thức cốt lõi để component cha có thể gọi trực tiếp qua Template Ref
        expose({ addRow, removeRow, updateRow, removeAllRow, clearSelection });

        return {
            localSelectedRows,
            editingRowKey,
            selectedPageSize,
            currentPage,
            totalRecords,
            totalPages,
            normalizedRows,
            pagedRows,
            allCurrentPageSelected,
            canGoPrev,
            canGoNext,
            rowRangeText,
            pageSizeStore,
            onToggleRow,
            onToggleAllCurrentPage,
            onRowClick,
            onRowAction,
            onEditorFocus,
            onEditorBlur,
            onEditorChange,
            onEditorInput,
            onEditorBeforeSelected,
            onEditorSelected,
            onEditorSearch,
            onGoFirst,
            onGoPrev,
            onGoNext,
            onGoLast,
            addRow,
            removeRow,
            removeAllRow,
            updateRow,
            clearSelection,
        };
    },
});
</script>
<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

.tb-root {
    width: 100%;
    height: 100%;

    &--disabled {
        opacity: 0.55;
        pointer-events: none;
    }
}

.tb-root__wrapper {
    width: 100%;
    height: calc(100% - 48px);
    border: $input-border;
    border-radius: $border-radius;
    background: #fff;
}

.tb-root__wrapper--no-pagination {
    height: 100%;
}

.tb-root__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.tb-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 12px;
    background: #fff;
    height: 48px;
}

.tb-pagination__controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.tb-pagination__left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tb-pagination__label,
.tb-pagination__range {
    font-size: $font-size-base;
    color: #374151;
    font-weight: 500;
}

.tb-pagination__page-size-combobox {
    width: 80px;
}

.tb-pagination__nav {
    display: flex;
    align-items: center;
    gap: 4px;
}

.tb-pagination__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: #374151;
    border-radius: 4px;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: $hover-color;
        color: $primary-color;
    }

    &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }
}

.tb-pagination__btn :deep(div) {
    pointer-events: none;
}
</style>
