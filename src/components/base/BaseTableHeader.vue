<template>
    <thead class="tb-header">
        <tr>
            <th v-if="showSelection" class="tb-header__cell tb-header__cell--selection">
                <BaseCheckbox :model-value="allSelected" @update:model-value="onToggleAll" />
            </th>
            <th
                v-for="column in visibleColumns"
                :key="column.dataField"
                class="tb-header__cell"
                :style="getColumnStyle(column)"
            >
                <slot :name="`header-${column.dataField}`" :column="column">
                    {{ column.title ?? column.dataField }}
                </slot>
            </th>
        </tr>
    </thead>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseCheckbox from "@/components/base/BaseCheckbox.vue";
import type { ColumnDefinition } from "@/models/common/columnDefinition";

const props = withDefaults(
    defineProps<{
        columns: ColumnDefinition[];
        showSelection?: boolean;
        allSelected?: boolean;
    }>(),
    {
        showSelection: true,
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
    z-index: 1;
    background: #f8f8f8;

    tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
}

.tb-header__cell {
    font-size: $font-size-base;
    padding: 0 12px;
    font-weight: 600;
    border-bottom: $input-border;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: 36px;
}

.tb-header__cell--selection {
    width: 44px;
    min-width: 44px;
    max-width: 44px;
    text-align: center;
}
</style>
