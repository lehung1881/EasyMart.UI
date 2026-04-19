<template>
    <tbody v-if="loading" class="tb-content tb-content--loading" aria-busy="true">
        <tr
            v-for="index in skeletonRowCount"
            :key="`skeleton-${index}`"
            class="tb-content__row tb-content__row--skeleton"
        >
            <td v-if="showSelection" class="tb-content__cell tb-content__cell--selection">
                <div class="tb-content__skeleton-line" />
            </td>
            <td
                v-for="column in visibleColumns"
                :key="`${column.dataField}-${index}`"
                class="tb-content__cell"
                :style="getColumnStyle(column)"
            >
                <div class="tb-content__skeleton-line" />
            </td>
            <td v-if="showRowAction" class="tb-content__cell tb-content__cell--row-action">
                <div class="tb-content__skeleton-line" />
            </td>
        </tr>
    </tbody>

    <tbody v-else-if="rows.length === 0" class="tb-content tb-content--state">
        <tr>
            <td
                class="tb-content__state"
                :colspan="visibleColumns.length + (showSelection ? 1 : 0) + (showRowAction ? 1 : 0)"
            >
                {{ emptyText }}
            </td>
        </tr>
    </tbody>

    <tbody v-else class="tb-content">
        <tr
            v-for="(row, index) in rows"
            :key="resolveRowKey(row, index)"
            class="tb-content__row"
            :class="{ 'tb-content__row--editing': isRowEditing(row) }"
            @click="onRowClick(row, index)"
            @focusout="onRowFocusOut($event, row)"
        >
            <td v-if="showSerial" class="tb-content__cell tb-content__cell--selection" @click.stop>{{ index + 1 }}</td>
            <td v-if="showSelection" class="tb-content__cell tb-content__cell--selection" @click.stop>
                <BaseCheckbox
                    :model-value="isRowChecked(row)"
                    @update:model-value="(checked) => onRowCheckboxChange(row, checked)"
                />
            </td>

            <td
                v-for="column in visibleColumns"
                :key="column.dataField"
                class="tb-content__cell"
                :style="getColumnStyle(column)"
            >
                <slot :name="`cell-${column.dataField}`" :row="row" :column="column">
                    <template v-if="isRowEditing(row, column)">
                        <component
                            :is="resolveEditorComponent(column)"
                            v-model="row[column.dataField]"
                            v-bind="resolveEditorProps(column, row)"
                            v-on="resolveEditorEvents(column, row)"
                        />
                    </template>
                    <template v-else>
                        {{ displayData(column, row) }}
                    </template>
                </slot>
            </td>

            <td v-if="showRowAction" class="tb-content__cell tb-content__cell--row-action">
                <slot name="row-action" :row="row" :index="index">
                    <div class="row-action">
                        <div
                            v-for="action in getVisibleRowActions(row)"
                            :key="action.actionName"
                            type="button"
                            class="row-action__item"
                            :title="action.actionName"
                            @click="onRowAction(action, row)"
                        >
                            <div :class="action.icon"></div>
                        </div>
                    </div>
                </slot>
            </td>
        </tr>
    </tbody>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseCheckbox from "@/components/controls/BaseCheckbox.vue";
import BaseInput from "@/components/controls/BaseInput.vue";
import BaseInputNumber from "@/components/controls/BaseInputNumber.vue";
import BaseCombobox from "@/components/controls/BaseCombobox.vue";
import BaseDatepicker from "@/components/controls/BaseDatepicker.vue";
import { ColumnType } from "@/constants";
import { formatData } from "@/commons/formatData";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import type { TableRow } from "@/composables/controls/useTableStore";

export interface TableRowAction {
    actionName: string;
    icon: string;
    show: (row: TableRow) => boolean;
}

type EditorEventName =
    | "update:modelValue"
    | "focus"
    | "blur"
    | "change"
    | "input"
    | "before-selected"
    | "selected"
    | "search";
type EditorPropsMap = Record<string, Record<string, unknown>>;

/**
 * Luôn cho phép hiển thị action với mọi dòng.
 * @param _row Dữ liệu dòng hiện tại.
 * @returns Luôn trả về true.
 */
const alwaysShowRowAction = (_row: TableRow): boolean => true;

/**
 * Tạo danh sách action mặc định cho row-action.
 * @returns Danh sách action mặc định.
 */
const getDefaultRowActions = (): TableRowAction[] => [
    {
        actionName: "Delete",
        icon: "icon-row-delete scale-[0.9]",
        show: alwaysShowRowAction,
    },
];

const props = withDefaults(
    defineProps<{
        data: TableRow[];
        columns: ColumnDefinition[];
        selectedRows: TableRow[];
        rowKey?: string;
        loading: boolean;
        emptyText?: string;
        showSelection?: boolean;
        showRowAction?: boolean;
        listRowAction?: TableRowAction[];
        pageSize?: number;
        editingRowKey?: string | number | null;
        draftRow?: TableRow | null;
        editorProps: EditorPropsMap;
        showSerial?: boolean;
    }>(),
    {
        rowKey: "id",
        emptyText: "Không có dữ liệu",
        showSelection: true,
        showRowAction: true,
        listRowAction: () => [],
        editingRowKey: null,
        draftRow: null,
        editorProps: () => ({}),
        showSerial: false,
    },
);

const emit = defineEmits<{
    (e: "row-click", payload: { row: TableRow; index: number }): void;
    (e: "toggle-row", payload: { row: TableRow; checked: boolean }): void;
    (e: "row-action-click", action: TableRowAction, row: TableRow): void;
    (e: "request-edit-row", row: TableRow): void;
    (e: "commit-row", row: TableRow): void;
    (e: "focus", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "blur", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "change", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "input", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "before-selected", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "selected", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
    (e: "search", row: TableRow, column: ColumnDefinition, ...args: unknown[]): void;
}>();

/**
 * Lấy danh sách cột hợp lệ để render body.
 * @returns Mảng cột hiển thị.
 */
const visibleColumns = computed<ColumnDefinition[]>(() =>
    props.columns.filter((column) => column.visible !== false && Boolean(column.dataField)),
);

/**
 * Lấy danh sách dòng hiển thị.
 * @returns Mảng row của bảng.
 */
const rows = computed<TableRow[]>(() => props.data ?? []);

/**
 * Xác định số dòng skeleton hiển thị khi loading.
 * @returns Số dòng skeleton.
 */
const skeletonRowCount = computed<number>(() => props.pageSize ?? 20);

/**
 * Cache danh sách action gốc để tránh tạo mới mỗi lần render row.
 * @returns Danh sách action nguồn.
 */
const baseRowActions = computed<TableRowAction[]>(() =>
    !props.listRowAction || props.listRowAction.length === 0 ? getDefaultRowActions() : props.listRowAction,
);

/**
 * Lấy tập key đã chọn để lookup O(1).
 * @returns Set chứa key của các dòng selected.
 */
const selectedRowKeySet = computed<Set<string | number>>(() => {
    const keySet = new Set<string | number>();
    props.selectedRows.forEach((row) => {
        const keyValue = row[props.rowKey];
        if (typeof keyValue === "string" || typeof keyValue === "number") {
            keySet.add(keyValue);
        }
    });
    return keySet;
});

const activeEditingRowKey = ref<string | number | null>(null);
const editorEventsCache = new WeakMap<TableRow, Map<string, Record<string, (...args: unknown[]) => void>>>();

/**
 * Đồng bộ key row đang edit từ component cha xuống state nội bộ.
 * @param value Key row đang được yêu cầu chuyển sang trạng thái edit.
 * @returns Không trả về giá trị.
 */
const syncActiveEditingRowKey = (value: string | number | null | undefined): void => {
    activeEditingRowKey.value = value ?? null;
};

watch(() => props.editingRowKey, syncActiveEditingRowKey, { immediate: true });

/**
 * Lấy danh sách action hợp lệ cần hiển thị cho từng dòng.
 * @param row Dữ liệu dòng hiện tại.
 * @returns Danh sách action được phép hiển thị.
 */
const getVisibleRowActions = (row: TableRow): TableRowAction[] => {
    return baseRowActions.value.filter((action) => action.show(row));
};

/**
 * Trả về style inline cho từng cell.
 * @param column Cấu hình cột.
 * @returns Object style cho td.
 */
const getColumnStyle = (column: ColumnDefinition): Record<string, string> => {
    const rawWidth = column.width;
    const normalizedWidth =
        rawWidth === undefined || rawWidth === null
            ? "auto"
            : typeof rawWidth === "number"
              ? `${rawWidth}px`
              : rawWidth;

    return {
        width: normalizedWidth,
        maxWidth: normalizedWidth,
        minWidth: normalizedWidth,
        textAlign: column.align ?? "left",
    };
};

/**
 * Format giá trị hiển thị theo cấu hình formatType của cột.
 * @param column Cấu hình cột chứa formatType và displayField.
 * @param row Dữ liệu row tương ứng.
 * @returns Chuỗi hiển thị đã được format.
 */
const displayData = (column: ColumnDefinition, row: TableRow): string => {
    const value = displayValueCell(row, column);
    const formatType = column.formatType ?? 0;

    if (formatType === 0 && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")) {
        return String(value);
    }

    return formatData.formatDisplayData(value, formatType);
};

/**
 * Lấy key cho từng dòng.
 * @param row Dữ liệu dòng.
 * @param index Index fallback.
 * @returns Key ổn định cho v-for.
 */
const resolveRowKey = (row: TableRow, index: number): string | number => {
    const keyValue = row[props.rowKey];
    if (typeof keyValue === "string" || typeof keyValue === "number") return keyValue;
    return index;
};

/**
 * Kiểm tra row đã được chọn hay chưa.
 * @param row Dữ liệu dòng.
 * @returns True khi row tồn tại trong selectedRows.
 */
const isRowChecked = (row: TableRow): boolean => {
    const rowKeyValue = row[props.rowKey];
    if (typeof rowKeyValue !== "string" && typeof rowKeyValue !== "number") return false;
    return selectedRowKeySet.value.has(rowKeyValue);
};

/**
 * Kiểm tra dòng hiện tại có đang ở chế độ edit hay không.
 * @param row Dữ liệu dòng.
 * @param column Cấu hình cột hiện tại, dùng để bỏ qua cột chỉ hiển thị.
 * @returns True nếu row đang edit.
 */
const isRowEditing = (row: TableRow, column: ColumnDefinition | null = null): boolean => {
    if (column && column.columnType == ColumnType.DisplayOnly) return false;
    const key = row[props.rowKey];
    if (typeof key !== "string" && typeof key !== "number") return false;
    return activeEditingRowKey.value === key;
};

/**
 * Bật chế độ edit cho một row.
 * @param row Dữ liệu dòng cần edit.
 * @returns Không trả về giá trị.
 */
const startEditingRow = (row: TableRow): void => {
    const key = row[props.rowKey];
    if (typeof key !== "string" && typeof key !== "number") return;
    activeEditingRowKey.value = key;
    emit("request-edit-row", row);
};

/**
 * Tắt chế độ edit khi blur ra ngoài row hiện tại.
 * @param event FocusEvent từ @focusout trên tr.
 * @param row Dữ liệu dòng.
 * @returns Không trả về giá trị.
 */
const onRowFocusOut = (event: FocusEvent, row: TableRow): void => {
    const tr = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && tr.contains(relatedTarget)) return;

    const key = row[props.rowKey];
    if (activeEditingRowKey.value === key) {
        activeEditingRowKey.value = null;
        onCellCommit(row);
    }
};

/**
 * Trả về danh sách event editor cần lắng nghe theo từng loại cột.
 * @param column Cấu hình cột hiện tại.
 * @returns Mảng tên event editor hợp lệ.
 */
const getEditorEventNames = (column: ColumnDefinition): EditorEventName[] => {
    switch (resolveColumnType(column)) {
        case ColumnType.Input:
            return ["update:modelValue", "focus", "blur", "change", "input"];
        case ColumnType.InputNumber:
            return ["update:modelValue", "focus", "blur", "change"];
        case ColumnType.Combobox:
            return ["update:modelValue", "change", "before-selected", "selected", "search"];
        case ColumnType.DatePicker:
            return ["update:modelValue", "focus", "blur", "change", "input"];
        case ColumnType.Checkbox:
            return ["update:modelValue", "change"];
        default:
            return [];
    }
};

/**
 * Chuẩn hóa `columnType` về kiểu số có thể render editor.
 * @param column Cấu hình cột.
 * @returns Giá trị column type theo hằng số ColumnType.
 */
const resolveColumnType = (column: ColumnDefinition): number => {
    if (column.columnType === undefined || column.columnType === null) return ColumnType.DisplayOnly;
    return column.columnType;
};

/**
 * Mapping từ ColumnType sang component editor tương ứng.
 */
const editorComponentMap: Record<number, unknown> = {
    [ColumnType.Input]: BaseInput,
    [ColumnType.InputNumber]: BaseInputNumber,
    [ColumnType.Checkbox]: BaseCheckbox,
    [ColumnType.Combobox]: BaseCombobox,
    [ColumnType.DatePicker]: BaseDatepicker,
};

/**
 * Resolve component cần render dựa trên column type.
 * @param column Cấu hình cột.
 * @returns Component hoặc null nếu không phù hợp.
 */
const resolveEditorComponent = (column: ColumnDefinition): unknown => {
    const columnType = resolveColumnType(column);
    return editorComponentMap[columnType] ?? null;
};

/**
 * Tạo object event handlers và cache theo row/column để tránh allocations lặp.
 * @param column Cấu hình cột đang render editor.
 * @param row Dữ liệu dòng đang edit.
 * @returns Object handler dùng cho `v-on`.
 */
const resolveEditorEvents = (column: ColumnDefinition, row: TableRow): Record<string, (...args: unknown[]) => void> => {
    const rowEventCache = editorEventsCache.get(row);
    const cachedHandlers = rowEventCache?.get(column.dataField);
    if (cachedHandlers) {
        return cachedHandlers;
    }

    const handlers: Record<string, (...args: unknown[]) => void> = {};
    const eventNames = getEditorEventNames(column);

    eventNames.forEach((eventName) => {
        handlers[eventName] = (...args: unknown[]) => {
            switch (eventName) {
                case "focus":
                    emit("focus", row, column, ...args);
                    break;
                case "blur":
                    emit("blur", row, column, ...args);
                    break;
                case "change":
                    emit("change", row, column, ...args);
                    break;
                case "input":
                    emit("input", row, column, ...args);
                    break;
                case "selected":
                    emit("selected", row, column, ...args);
                    break;
                case "before-selected":
                    emit("before-selected", row, column, ...args);
                    break;
                case "search":
                    emit("search", row, column, ...args);
                    break;
                default:
            }
        };
    });

    const nextRowEventCache = rowEventCache ?? new Map<string, Record<string, (...args: unknown[]) => void>>();
    nextRowEventCache.set(column.dataField, handlers);
    editorEventsCache.set(row, nextRowEventCache);
    return handlers;
};

/**
 * Lấy giá trị ô ưu tiên theo displayField nếu có.
 * @param row Dữ liệu row gốc.
 * @param column Cấu hình cột.
 * @returns Giá trị đang hiển thị cho cell.
 */
const displayValueCell = (row: TableRow, column: ColumnDefinition): unknown => {
    const field = column.displayField ? column.displayField : column.dataField;
    return row[field];
};

/**
 * Trả về props editor đã merge với cấu hình mặc định.
 * @param column Cấu hình cột.
 * @param _row Dữ liệu row.
 * @returns Props truyền vào editor component.
 */
const resolveEditorProps = (column: ColumnDefinition, _row: TableRow): Record<string, unknown> => {
    return {
        ...(props.editorProps[column.dataField] ?? {}),
        size: "sm",
    };
};

/**
 * Emit sự kiện toggle row khi checkbox thay đổi.
 * @param row Dữ liệu dòng.
 * @param checked Trạng thái checkbox.
 * @returns Không trả về giá trị.
 */
const onRowCheckboxChange = (row: TableRow, checked: boolean): void => {
    emit("toggle-row", { row, checked });
};

/**
 * Emit sự kiện khi click dòng, đồng thời bật chế độ edit cho row đó.
 * @param row Dữ liệu dòng được click.
 * @param index Chỉ số dòng.
 * @returns Không trả về giá trị.
 */
const onRowClick = (row: TableRow, index: number): void => {
    startEditingRow(row);
    emit("row-click", { row, index });
};

/**
 * Emit sự kiện khi người dùng click một row action.
 * @param action Action được click.
 * @param row Dữ liệu dòng tương ứng với action.
 * @returns Không trả về giá trị.
 */
const onRowAction = (action: TableRowAction, row: TableRow): void => {
    emit("row-action-click", action, row);
};

/**
 * Commit ngay row hiện tại theo cơ chế blur/select.
 * @param row Dữ liệu row cần commit.
 * @returns Không trả về giá trị.
 */
const onCellCommit = (row: TableRow): void => {
    emit("commit-row", row);
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

$border-color: #d0d0d0;

.tb-content {
    tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
    z-index: 1;
}

.tb-content__state {
    padding: 16px;
    text-align: center;
    opacity: 0.7;
}

.tb-content__row {
    cursor: pointer;
    transition: background 0.12s ease;

    &:hover {
        background: $hover-color;
        .tb-content__cell {
            background: $hover-color;
        }
    }
}

.tb-content__row:hover .tb-content__cell--row-action .row-action,
.tb-content__row:focus-within .tb-content__cell--row-action .row-action {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
}

.tb-content__row--skeleton {
    cursor: default;

    &:hover {
        background: transparent;
    }
}

.tb-content__cell {
    font-size: $font-size-base;
    padding: 0 12px;
    border-bottom: 1px solid rgba($border-color, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: inherit;
    height: 34px;
}

.tb-cell-editor {
    width: 100%;
    min-height: 30px;
    display: flex;
    align-items: center;
    white-space: normal;
}

.tb-cell-editor :deep(.base-input-wrapper),
.tb-cell-editor :deep(.base-input-number-wrapper),
.tb-cell-editor :deep(.base-datepicker-wrapper),
.tb-cell-editor :deep(.cb-root) {
    width: 100%;
}

.tb-content__cell--selection {
    width: 44px;
    min-width: 44px;
    max-width: 44px;
    text-align: center;
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: #ffffff;
}

.tb-content__skeleton-line {
    width: 100%;
    height: 14px;
    border-radius: 6px;
    background: linear-gradient(90deg, #eceff3 0%, #f5f6f8 40%, #eceff3 80%);
    background-size: 200% 100%;
    animation: tb-skeleton 1.25s linear infinite;
}

@keyframes tb-skeleton {
    from {
        background-position: 200% 0;
    }
    to {
        background-position: -200% 0;
    }
}

.tb-content__cell--row-action {
    height: 34px;
    position: sticky;
    width: 50px;
    right: 0;
    background-color: #ffffff;
}

.row-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    pointer-events: none;
    transition: opacity 0.12s ease;
    height: 100%;
}

.row-action__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;

    &:hover {
        background: $hover-color;
    }
}
</style>
