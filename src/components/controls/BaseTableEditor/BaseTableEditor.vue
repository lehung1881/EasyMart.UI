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

export type TableRow = Record<string, unknown>;

interface PageSizeOption {
    label: string;
    value: number;
}

export default defineComponent({
    name: "BaseTableEditor",

    components: {
        BaseCombobox,
        BaseTableEditorHeader,
        BaseTableEditorContent,
    },

    props: {
        modelValue: { type: Array as () => TableRow[], required: true },
        columns: { type: Array as () => ColumnDefinition[], required: true },
        rowKey: { type: String, default: "id" },
        disabled: { type: Boolean, default: false },
        emptyText: { type: String, default: "Không có dữ liệu" },
        showSelection: { type: Boolean, default: true },
        showRowAction: { type: Boolean, default: true },
        listRowAction: { type: Array as () => TableRowAction[], default: () => [] },
        defaultDataAddRow: { type: Object as () => TableRow, default: undefined },
        editorProps: { type: Object, default: () => ({}) },
        showPagination: { type: Boolean, default: true },
        pageSizeOptions: { type: Array as () => number[], default: () => [10, 20, 30, 50, 100] },
        showSerial: { type: Boolean, default: false },
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
        const localSelectedRows = ref<TableRow[]>([]);
        const editingRowKey = ref<string | number | null>(null);
        const selectedPageSize = ref<number>(20);
        const currentPage = ref<number>(1);

        /**
         * lvhung - 19.06.2026
         * Lấy key của một row dựa trên rowKey hiện tại.
         */
        const getRowKeyValue = (row: TableRow): string | number => row[props.rowKey] as string | number;

        /**
         * lvhung - 19.06.2026
         * Lấy page size mặc định ưu tiên 20, fallback option đầu tiên.
         */
        const getDefaultPageSize = (): number => {
            if (!props.showPagination) return 1000;
            if (props.pageSizeOptions.includes(20)) return 20;
            return props.pageSizeOptions[0] ?? 20;
        };

        // COMPUTED
        const totalRecords = computed<number>(() => props.modelValue.length);

        const totalPages = computed<number>(() => {
            if (selectedPageSize.value <= 0) return 1;
            const pages = Math.ceil(totalRecords.value / selectedPageSize.value);
            return pages > 0 ? pages : 1;
        });

        const pagedRows = computed<TableRow[]>(() => {
            const startIndex = (currentPage.value - 1) * selectedPageSize.value;
            return props.modelValue.slice(startIndex, startIndex + selectedPageSize.value);
        });

        const allCurrentPageSelected = computed<boolean>(() => {
            if (!props.showSelection || pagedRows.value.length === 0) return false;
            return pagedRows.value.every((row) =>
                localSelectedRows.value.some((selectedRow) => getRowKeyValue(selectedRow) === getRowKeyValue(row)),
            );
        });

        const canGoPrev = computed<boolean>(() => currentPage.value > 1);
        const canGoNext = computed<boolean>(() => currentPage.value < totalPages.value);

        const rowRangeText = computed<string>(() => {
            if (totalRecords.value === 0) return "0 - 0";
            const start = (currentPage.value - 1) * selectedPageSize.value + 1;
            const end = Math.min(currentPage.value * selectedPageSize.value, totalRecords.value);
            return `${start} - ${end}`;
        });

        const pageSizeData = computed<PageSizeOption[]>(() =>
            props.pageSizeOptions.map((size) => ({ label: String(size), value: size })),
        );

        const pageSizeStore = useComboboxStore("table_editor_page_size", {
            queryMode: "local",
            data: pageSizeData.value,
            comboboxLoadData: async () => [],
            displayField: "label",
            valueField: "value",
        });

        // ACTIONS
        /**
         * lvhung - 19.06.2026
         * Toggle chọn từng row trong bảng.
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
         * lvhung - 19.06.2026
         * Toggle chọn tất cả row trên trang hiện tại.
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
         * lvhung - 19.06.2026
         * Emit sự kiện click row ra ngoài và đồng bộ row đang edit.
         */
        const onRowClick = (payload: { row: TableRow; index: number }): void => {
            editingRowKey.value = getRowKeyValue(payload.row);
            emit("row-click", payload);
        };

        /**
         * lvhung - 19.06.2026
         * Xóa một dòng khỏi bảng và emit sự kiện row action ra ngoài.
         */
        const removeRow = (row: TableRow): void => {
            const metaData = { row, allowDelete: true };
            emit("beforeRemoveRow", metaData);
            if (metaData.allowDelete) {
                const key = getRowKeyValue(row);
                const newRows = props.modelValue.filter((r) => getRowKeyValue(r) !== key);
                localSelectedRows.value = localSelectedRows.value.filter((r) => getRowKeyValue(r) !== key);
                if (editingRowKey.value === key) editingRowKey.value = null;
                emit("update:modelValue", newRows);
            }
        };

        const onRowAction = (action: TableRowAction, row: TableRow): void => {
            if (action.actionName.trim().toLowerCase() === "delete") removeRow(row);
            emit("row-action-click", action, row);
        };

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

        const onGoFirst = (): void => {
            currentPage.value = 1;
            emit("page-change", currentPage.value);
        };
        const onGoPrev = (): void => {
            if (!canGoPrev.value) return;
            currentPage.value -= 1;
            emit("page-change", currentPage.value);
        };
        const onGoNext = (): void => {
            if (!canGoNext.value) return;
            currentPage.value += 1;
            emit("page-change", currentPage.value);
        };
        const onGoLast = (): void => {
            currentPage.value = totalPages.value;
            emit("page-change", currentPage.value);
        };

        /**
         * lvhung - 19.06.2026
         * Thêm dòng mới vào bảng với dữ liệu ngầm định.
         */
        const addRow = (): void => {
            if (!props.defaultDataAddRow) return;
            const newRecord = reactive({ ...props.defaultDataAddRow });
            newRecord[props.rowKey] = commonFunction.generateGUIDV7();
            const metaData = { row: newRecord, allowInsert: true };
            emit("beforeAddRow", metaData);
            if (metaData.allowInsert) {
                editingRowKey.value = getRowKeyValue(newRecord);
                const nextTotal = props.modelValue.length + 1;
                currentPage.value = Math.max(1, Math.ceil(nextTotal / selectedPageSize.value));
                emit("update:modelValue", [...props.modelValue, newRecord]);
                emit("page-change", currentPage.value);
            }
        };

        /**
         * lvhung - 19.06.2026
         * Xóa tất cả dòng trong bảng.
         */
        const removeAllRow = (): void => {
            emit("update:modelValue", []);
        };

        /**
         * lvhung - 19.06.2026
         * Cập nhật thông tin của một row theo rowKey.
         */
        const updateRow = (row: TableRow): void => {
            const key = getRowKeyValue(row);
            const newRows = props.modelValue.map((r) => (getRowKeyValue(r) === key ? { ...r, ...row } : r));
            emit("update:modelValue", newRows);
        };

        const clearSelection = (): void => {
            localSelectedRows.value = [];
        };

        // WATCHERS
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

        watch(selectedPageSize, (nextPageSize) => {
            if (!props.pageSizeOptions.includes(nextPageSize)) {
                selectedPageSize.value = getDefaultPageSize();
                return;
            }
            currentPage.value = 1;
            emit("page-size-change", selectedPageSize.value);
            emit("page-change", currentPage.value);
        });

        watch(
            () => props.modelValue.length,
            () => {
                if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
                if (currentPage.value < 1) currentPage.value = 1;
                emit("page-change", currentPage.value);
            },
            { immediate: true },
        );

        // LIFECYCLE
        selectedPageSize.value = getDefaultPageSize();

        onBeforeUnmount(() => pageSizeStore.$dispose());

        // EXPOSE — thay thế defineExpose trong script setup
        expose({ addRow, removeRow, updateRow, removeAllRow, clearSelection });

        return {
            localSelectedRows,
            editingRowKey,
            selectedPageSize,
            currentPage,
            totalRecords,
            totalPages,
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
