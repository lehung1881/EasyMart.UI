<template>
    <div class="tb-root" :class="{ 'tb-root--disabled': disabled }">
        <div class="tb-root__wrapper overflow-auto" :class="{ 'tb-root__wrapper--no-pagination': !showPagination }">
            <table class="tb-root__table">
                <BaseTableEditorHeader
                    :columns="columns"
                    :show-selection="showSelection"
                    :show-row-action="showRowAction"
                    :all-selected="allCurrentPageSelected"
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
                    @row-click="onRowClick"
                    @toggle-row="onToggleRow"
                    @row-action-click="onRowAction"
                    @focus="onEditorFocus"
                    @blur="onEditorBlur"
                    @change="onEditorChange"
                    @input="onEditorInput"
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

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import BaseCombobox from "@/components/controls/BaseCombobox.vue";
import BaseTableEditorHeader from "@/components/controls/BaseTableEditor/BaseTableEditorHeader.vue";
import BaseTableEditorContent, {
    type TableRowAction,
} from "@/components/controls/BaseTableEditor/BaseTableEditorContent.vue";
import { useComboboxStore } from "@/composables/controls/useComboboxStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import commonFunction from "@/commons/commonFunction";

export type TableRow = Record<string, unknown>;

interface PageSizeOption {
    label: string;
    value: number;
}

const props = withDefaults(
    defineProps<{
        modelValue: TableRow[];
        columns: ColumnDefinition[];
        rowKey?: string;
        disabled?: boolean;
        emptyText?: string;
        showSelection?: boolean;
        showRowAction?: boolean;
        listRowAction?: TableRowAction[];
        defaultDataAddRow?: TableRow;
        editorProps: any;
        showPagination?: boolean;
        pageSizeOptions?: number[];
    }>(),
    {
        rowKey: "id",
        disabled: false,
        emptyText: "Không có dữ liệu",
        showSelection: true,
        showRowAction: true,
        listRowAction: () => [],
        editorProps: () => ({}),
        showPagination: true,
        pageSizeOptions: () => [10, 20, 30, 50, 100],
    },
);

const emit = defineEmits<{
    (e: "update:modelValue", rows: TableRow[]): void;
    (e: "row-click", payload: { row: TableRow; index: number }): void;
    (e: "row-action-click", action: TableRowAction, row: TableRow): void;
    (e: "update:selectedRows", rows: TableRow[]): void;
    (e: "beforeAddRow", metaData: { row: TableRow; allowInsert: boolean }): void;
    (e: "beforeRemoveRow", metaData: { row: TableRow; allowDelete: boolean }): void;
    (e: "focus", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "blur", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "change", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "input", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "selected", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "search", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "page-change", page: number): void;
    (e: "page-size-change", pageSize: number): void;
}>();

const localSelectedRows = ref<TableRow[]>([]);
const editingRowKey = ref<string | number | null>(null);
const selectedPageSize = ref<number>(20);
const currentPage = ref<number>(1);

/**
 * Lấy key của một row dựa trên rowKey hiện tại.
 * @param row Dữ liệu dòng cần lấy key.
 * @returns Key dạng string hoặc number.
 */
const getRowKeyValue = (row: TableRow): string | number => row[props.rowKey] as string | number;

/**
 * Lấy page size mặc định ưu tiên 20, fallback option đầu tiên.
 * @returns Page size mặc định hợp lệ.
 */
const getDefaultPageSize = (): number => {
    if (props.pageSizeOptions.includes(20)) return 20;
    return props.pageSizeOptions[0] ?? 20;
};

/**
 * Tổng số bản ghi hiện có.
 * @returns Tổng số record của bảng.
 */
const totalRecords = computed<number>(() => props.modelValue.length);

/**
 * Tổng số trang dựa trên page size hiện tại.
 * @returns Số trang tối thiểu là 1.
 */
const totalPages = computed<number>(() => {
    if (selectedPageSize.value <= 0) return 1;
    const pages = Math.ceil(totalRecords.value / selectedPageSize.value);
    return pages > 0 ? pages : 1;
});

/**
 * Lấy danh sách row của trang hiện tại.
 * @returns Dữ liệu đã cắt theo currentPage và selectedPageSize.
 */
const pagedRows = computed<TableRow[]>(() => {
    const startIndex = (currentPage.value - 1) * selectedPageSize.value;
    return props.modelValue.slice(startIndex, startIndex + selectedPageSize.value);
});

/**
 * Kiểm tra tất cả row ở trang hiện tại đã được chọn hay chưa.
 * @returns True nếu toàn bộ row trang hiện tại đang selected.
 */
const allCurrentPageSelected = computed<boolean>(() => {
    if (!props.showSelection || pagedRows.value.length === 0) return false;
    return pagedRows.value.every((row) =>
        localSelectedRows.value.some((selectedRow) => getRowKeyValue(selectedRow) === getRowKeyValue(row)),
    );
});

/**
 * Kiểm tra có thể chuyển sang trang trước hay không.
 * @returns True khi currentPage > 1.
 */
const canGoPrev = computed<boolean>(() => currentPage.value > 1);

/**
 * Kiểm tra có thể chuyển sang trang sau hay không.
 * @returns True khi currentPage < totalPages.
 */
const canGoNext = computed<boolean>(() => currentPage.value < totalPages.value);

/**
 * Tạo text khoảng dòng đang hiển thị ở trang hiện tại.
 * @returns Chuỗi dạng start - end.
 */
const rowRangeText = computed<string>(() => {
    if (totalRecords.value === 0) return "0 - 0";
    const start = (currentPage.value - 1) * selectedPageSize.value + 1;
    const end = Math.min(currentPage.value * selectedPageSize.value, totalRecords.value);
    return `${start} - ${end}`;
});

/**
 * Chuyển danh sách page size thành dữ liệu combobox.
 * @returns Mảng option cho combobox page size.
 */
const pageSizeData = computed<PageSizeOption[]>(() =>
    props.pageSizeOptions.map((size) => ({
        label: String(size),
        value: size,
    })),
);

const pageSizeStore = useComboboxStore("table_editor_page_size", {
    queryMode: "local",
    data: pageSizeData.value,
    comboboxLoadData: async () => [],
    displayField: "label",
    valueField: "value",
});

/**
 * Toggle chọn từng row trong bảng.
 * @param payload Thông tin row và trạng thái checked mới.
 * @returns Không trả về giá trị.
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
 * Toggle chọn tất cả row trên trang hiện tại.
 * @param checked Trạng thái checkbox ở header.
 * @returns Không trả về giá trị.
 */
const onToggleAllCurrentPage = (checked: boolean): void => {
    if (checked) {
        const selectedRowMap = new Map(localSelectedRows.value.map((row) => [getRowKeyValue(row), row]));
        pagedRows.value.forEach((row) => {
            selectedRowMap.set(getRowKeyValue(row), row);
        });
        localSelectedRows.value = Array.from(selectedRowMap.values());
    } else {
        const currentPageKeys = new Set(pagedRows.value.map((row) => getRowKeyValue(row)));
        localSelectedRows.value = localSelectedRows.value.filter((row) => !currentPageKeys.has(getRowKeyValue(row)));
    }
    emit("update:selectedRows", [...localSelectedRows.value]);
};

/**
 * Emit sự kiện click row ra ngoài và đồng bộ row đang edit.
 * @param payload Dữ liệu row được click.
 * @returns Không trả về giá trị.
 */
const onRowClick = (payload: { row: TableRow; index: number }): void => {
    editingRowKey.value = getRowKeyValue(payload.row);
    emit("row-click", payload);
};

/**
 * Emit sự kiện row action ra ngoài component cha.
 * @param action Action được click.
 * @param row Dữ liệu row tương ứng.
 * @returns Không trả về giá trị.
 */
const onRowAction = (action: TableRowAction, row: TableRow): void => {
    if (action.actionName.trim().toLowerCase() === "delete") {
        removeRow(row);
    }
    emit("row-action-click", action, row);
};

/**
 * Emit lại sự kiện focus từ editor ô để form cha có thể xử lý.
 * @param row Dữ liệu dòng của ô editor.
 * @param column Cấu hình cột của ô editor.
 * @param args Danh sách tham số gốc từ control.
 * @returns Không trả về giá trị.
 */
const onEditorFocus = (row: TableRow, column: ColumnDefinition, ...args: unknown[]): void => {
    emit("focus", row, column, ...args);
};

/**
 * Emit lại sự kiện blur từ editor ô để form cha có thể xử lý.
 * @param row Dữ liệu dòng của ô editor.
 * @param column Cấu hình cột của ô editor.
 * @param args Danh sách tham số gốc từ control.
 * @returns Không trả về giá trị.
 */
const onEditorBlur = (row: TableRow, column: ColumnDefinition, ...args: unknown[]): void => {
    emit("blur", row, column, ...args);
};

/**
 * Emit lại sự kiện change từ editor ô để form cha có thể xử lý.
 * @param row Dữ liệu dòng của ô editor.
 * @param column Cấu hình cột của ô editor.
 * @param args Danh sách tham số gốc từ control.
 * @returns Không trả về giá trị.
 */
const onEditorChange = (row: TableRow, column: ColumnDefinition, ...args: unknown[]): void => {
    emit("change", row, column, ...args);
};

/**
 * Emit lại sự kiện input từ editor ô để form cha có thể xử lý.
 * @param row Dữ liệu dòng của ô editor.
 * @param column Cấu hình cột của ô editor.
 * @param args Danh sách tham số gốc từ control.
 * @returns Không trả về giá trị.
 */
const onEditorInput = (row: TableRow, column: ColumnDefinition, ...args: unknown[]): void => {
    emit("input", row, column, ...args);
};

/**
 * Emit lại sự kiện selected từ editor ô để form cha có thể xử lý.
 * @param row Dữ liệu dòng của ô editor.
 * @param column Cấu hình cột của ô editor.
 * @param args Danh sách tham số gốc từ control.
 * @returns Không trả về giá trị.
 */
const onEditorSelected = (row: TableRow, column: ColumnDefinition, ...args: unknown[]): void => {
    emit("selected", row, column, ...args);
};

/**
 * Emit lại sự kiện search từ editor ô để form cha có thể xử lý.
 * @param row Dữ liệu dòng của ô editor.
 * @param column Cấu hình cột của ô editor.
 * @param args Danh sách tham số gốc từ control.
 * @returns Không trả về giá trị.
 */
const onEditorSearch = (row: TableRow, column: ColumnDefinition, ...args: unknown[]): void => {
    emit("search", row, column, ...args);
};

/**
 * Điều hướng về trang đầu.
 * @returns Không trả về giá trị.
 */
const onGoFirst = (): void => {
    currentPage.value = 1;
    emit("page-change", currentPage.value);
};

/**
 * Điều hướng về trang trước.
 * @returns Không trả về giá trị.
 */
const onGoPrev = (): void => {
    if (!canGoPrev.value) return;
    currentPage.value -= 1;
    emit("page-change", currentPage.value);
};

/**
 * Điều hướng sang trang kế tiếp.
 * @returns Không trả về giá trị.
 */
const onGoNext = (): void => {
    if (!canGoNext.value) return;
    currentPage.value += 1;
    emit("page-change", currentPage.value);
};

/**
 * Điều hướng về trang cuối.
 * @returns Không trả về giá trị.
 */
const onGoLast = (): void => {
    currentPage.value = totalPages.value;
    emit("page-change", currentPage.value);
};

/**
 * Hàm thêm dòng mới vào bảng.
 * @returns Không trả về giá trị.
 */
const addRow = (): void => {
    if (props.defaultDataAddRow) {
        const record = reactive({ ...props.defaultDataAddRow });
        record[props.rowKey] = commonFunction.generateGUID();
        const metaData = {
            row: record,
            allowInsert: true,
        };
        emit("beforeAddRow", metaData);
        if (metaData.allowInsert) {
            editingRowKey.value = getRowKeyValue(record);
            const nextTotal = props.modelValue.length + 1;
            currentPage.value = Math.max(1, Math.ceil(nextTotal / selectedPageSize.value));
            emit("update:modelValue", [...props.modelValue, record]);
            emit("page-change", currentPage.value);
        }
    }
};

/**
 * Xóa một dòng khỏi bảng.
 * @param row Dữ liệu dòng cần xóa.
 * @returns Không trả về giá trị.
 */
const removeRow = (row: TableRow): void => {
    const metaData = {
        row,
        allowDelete: true,
    };
    emit("beforeRemoveRow", metaData);

    if (metaData.allowDelete) {
        const key = getRowKeyValue(row);
        const newRows = props.modelValue.filter((item) => getRowKeyValue(item) !== key);
        localSelectedRows.value = localSelectedRows.value.filter((item) => getRowKeyValue(item) !== key);
        if (editingRowKey.value === key) {
            editingRowKey.value = null;
        }
        emit("update:modelValue", newRows);
    }
};

/**
 * Cập nhật thông tin của một row theo rowKey.
 * @param row Dữ liệu row mới.
 * @returns Không trả về giá trị.
 */
const updateRow = (row: TableRow): void => {
    const key = getRowKeyValue(row);
    const newRows = props.modelValue.map((item) => (getRowKeyValue(item) === key ? { ...item, ...row } : item));
    emit("update:modelValue", newRows);
};

/**
 * Đồng bộ options page size vào combobox store.
 * @param nextData Danh sách option mới.
 * @returns Không trả về giá trị.
 */
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

/**
 * Áp dụng page size mới khi người dùng thay đổi combobox.
 * @param nextPageSize Page size mới được chọn.
 * @returns Không trả về giá trị.
 */
watch(selectedPageSize, (nextPageSize) => {
    if (!props.pageSizeOptions.includes(nextPageSize)) {
        selectedPageSize.value = getDefaultPageSize();
        return;
    }
    currentPage.value = 1;
    emit("page-size-change", selectedPageSize.value);
    emit("page-change", currentPage.value);
});

/**
 * Đảm bảo currentPage luôn hợp lệ sau khi dữ liệu thay đổi.
 * @returns Không trả về giá trị.
 */
watch(
    () => props.modelValue.length,
    () => {
        if (currentPage.value > totalPages.value) {
            currentPage.value = totalPages.value;
            emit("page-change", currentPage.value);
        }
        if (currentPage.value < 1) {
            currentPage.value = 1;
            emit("page-change", currentPage.value);
        }
    },
    { immediate: true },
);

selectedPageSize.value = getDefaultPageSize();

/**
 * Hủy store page size khi component bị unmount.
 * @returns Không trả về giá trị.
 */
onBeforeUnmount(() => {
    pageSizeStore.$dispose();
});

defineExpose({
    addRow,
    removeRow,
    updateRow,
    clearSelection: () => {
        localSelectedRows.value = [];
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
