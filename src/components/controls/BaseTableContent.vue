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
            @click="onRowClick(row, index)"
        >
            <td v-if="showSelection" class="tb-content__cell tb-content__cell--selection" @click.stop>
                <BaseCheckbox
                    :model-value="isRowChecked(row)"
                    @update:model-value="(checked) => onRowCheckboxChange(row, checked)"
                />
            </td>

            <slot name="row" :row="row" :index="index" :columns="visibleColumns">
                <td
                    v-for="column in visibleColumns"
                    :key="column.dataField"
                    class="tb-content__cell"
                    :style="getColumnStyle(column)"
                >
                    <slot :name="`cell-${column.dataField}`" :row="row" :value="row[column.dataField]" :column="column">
                        {{ displayData(row[column.dataField], column) }}
                    </slot>
                </td>
            </slot>
            <td v-if="showRowAction" class="tb-content__cell tb-content__cell--row-action">
                <slot name="row-action" :row="row" :index="index">
                    <div class="row-action">
                        <button
                            v-for="action in getVisibleRowActions(row)"
                            :key="action.actionName"
                            type="button"
                            class="row-action__item"
                            :title="action.actionName"
                            @click="onRowAction(action, row)"
                        >
                            <div :class="action.icon"></div>
                        </button>
                    </div>
                </slot>
            </td>
        </tr>
    </tbody>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseCheckbox from "@/components/controls/BaseCheckbox.vue";
import { formatData } from "@/commons/formatData";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import type { TableRow } from "@/composables/controls/useTableStore";

export interface TableRowAction {
    actionName: string;
    icon: string;
    show: (row: TableRow) => boolean;
}

/**
 * Luôn cho phép hiển thị action với mọi dòng.
 * @param _row Dữ liệu dòng hiện tại.
 * @returns Luôn trả về true.
 */
const alwaysShowRowAction = (_row: TableRow): boolean => true;

/**
 * Tạo danh sách action mặc định cho row-action.
 * @returns Danh sách gồm Sửa và Xóa._i
 */
const getDefaultRowActions = (): TableRowAction[] => [
    {
        actionName: "Edit",
        icon: "icon-row-edit scale-[0.9]",
        show: alwaysShowRowAction,
    },
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
    }>(),
    {
        rowKey: "id",
        emptyText: "Không có dữ liệu",
        showSelection: true,
        showRowAction: true,
        listRowAction: () => [],
    },
);

const emit = defineEmits<{
    (e: "row-click", payload: { row: TableRow; index: number }): void;
    (e: "toggle-row", payload: { row: TableRow; checked: boolean }): void;
    (e: "row-action-click", action: TableRowAction, row: TableRow): void;
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
 * Lấy danh sách action hợp lệ cần hiển thị cho từng dòng.
 * @param row Dữ liệu dòng hiện tại.
 * @returns Danh sách action được phép hiển thị.
 */
const getVisibleRowActions = (row: TableRow): TableRowAction[] => {
    const rowActions =
        !props.listRowAction || props.listRowAction.length === 0 ? getDefaultRowActions() : props.listRowAction;
    return rowActions.filter((action) => action.show(row));
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
 * @param value Giá trị raw của ô dữ liệu.
 * @param column Cấu hình cột chứa formatType.
 * @returns Chuỗi hiển thị đã được format.
 */
const displayData = (value: unknown, column: ColumnDefinition): string => {
    return formatData.formatDisplayData(value, column.formatType ?? 0);
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
    return props.selectedRows.some((selectedRow) => selectedRow[props.rowKey] === rowKeyValue);
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
 * Emit sự kiện khi click dòng.
 * @param row Dữ liệu dòng được click.
 * @param index Chỉ số dòng.
 * @returns Không trả về giá trị.
 */
const onRowClick = (row: TableRow, index: number): void => {
    emit("row-click", { row, index });
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
    &:last-child {
        .tb-content__cell {
            border-bottom: unset;
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
    height: 36px;
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
    height: 36px;
    position: sticky;
    width: 80px;
    right: 0;
    background-color: #ffffff;

    .row-action {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        height: 100%;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.12s ease;
    }

    .row-action__item {
        width: 24px;
        height: 24px;
        background-color: #ffffff;
        border-radius: 100%;
        box-shadow: 0 1px 10px rgba(0, 0, 0, 0.0588235294);
        border: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
}
</style>
