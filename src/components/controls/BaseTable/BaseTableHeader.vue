<template>
    <thead class="tb-header">
        <tr>
            <th v-if="showSelection" class="tb-header__cell tb-header__cell--selection">
                <div class="header-title">
                    <BaseCheckbox :model-value="allSelected" @update:model-value="onToggleAll" />
                </div>
            </th>
            <th
                v-for="column in visibleColumns"
                :key="column.dataField"
                class="tb-header__cell"
                :style="getColumnStyle(column)"
            >
                <slot :name="`header-${column.dataField}`" :column="column">
                    <div class="header-title">
                        {{ column.title ?? column.dataField }}
                    </div>
                </slot>
            </th>
            <th v-if="showRowAction" class="tb-header__cell tb-header__cell--actions">
                <div class="header-title-action"></div>
            </th>
        </tr>
    </thead>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseCheckbox from "@/components/controls/BaseCheckbox.vue";
import type { ColumnDefinition } from "@/models/common/columnDefinition";

const props = withDefaults(
    defineProps<{
        columns: ColumnDefinition[];
        showSelection?: boolean;
        showRowAction?: boolean;
        allSelected?: boolean;
    }>(),
    {
        showSelection: true,
        showRowAction: true,
        allSelected: false,
    },
);

const emit = defineEmits<{
    (e: "toggle-all", checked: boolean): void;
}>();

/**
 * Lấy danh sách cột hợp lệ để render header.
 * @returns Mảng cột hiển thị.
 */
const visibleColumns = computed<ColumnDefinition[]>(() =>
    props.columns.filter((column) => column.visible !== false && Boolean(column.dataField)),
);

/**
 * Trả về style inline cho từng cột header.
 * @param column Cấu hình cột.
 * @returns Object style cho th.
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
 * Emit sự kiện toggle tất cả dòng ở trang hiện tại.
 * @param checked Trạng thái checkbox header.
 * @returns Không trả về giá trị.
 */
const onToggleAll = (checked: boolean): void => {
    emit("toggle-all", checked);
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

.tb-header {
    position: sticky;
    top: 0;
    z-index: 2;
    tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
}

.tb-header__cell {
    font-size: $font-size-base;
    font-weight: 600;
    border-bottom: $input-border;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 32px;
    position: sticky;
    background: #f8f8f8;
    .header-title {
        max-width: 100%;
        padding: 0 12px;
        border-right: 1px solid #d1d5db;
        height: 20px;
    }
    &:nth-last-child(2) {
        .header-title {
            border-right: unset;
        }
    }
    .header-title-action {
        border-left: 1px solid #d1d5db;
        height: 20px;
    }
}

.tb-header__cell--selection {
    width: 44px;
    min-width: 44px;
    max-width: 44px;
    text-align: center;
    position: sticky;
    left: 0;
    z-index: 3;
}
.tb-header__cell--actions {
    width: 80px;
    min-width: 80px;
    max-width: 80px;
    position: sticky;
    right: 0;
    z-index: 1;
}
</style>
