<template>
    <span
        class="status-tag"
        :style="tagStyle"
    >
        <span
            class="status-dot"
            :style="{ backgroundColor: currentVariant.dotColor }"
        />

        {{ currentStatus?.text ?? defaultText }}
    </span>
</template>

<script setup lang="ts">
/**
 * StatusTag
 *
 * Hiển thị trạng thái dưới dạng tag màu.
 *
 * Các variant hỗ trợ:
 * - default : Trạng thái mặc định (xám)
 * - info    : Thông tin / Đang xử lý (xanh dương)
 * - success : Thành công (xanh lá)
 * - warning : Cảnh báo / Chờ xử lý (vàng)
 * - danger  : Lỗi / Từ chối (đỏ)
 * - accent  : Màu nhấn mạnh (tím)
 *
 * Ví dụ:
 *
 * const orderStatus = [
 *     {
 *         value: 1,
 *         text: 'Nháp',
 *         variant: 'default',
 *     },
 *     {
 *         value: 2,
 *         text: 'Đang xử lý',
 *         variant: 'info',
 *     },
 * ];
 *
 * <StatusTag
 *     :status="record.Status"
 *     :list-status="orderStatus"
 * />
 */

import { computed, type CSSProperties } from 'vue';

export type StatusVariant =
    | 'default'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'accent';

export interface StatusItem {
    value: number | string;
    text: string;
    variant?: StatusVariant;
}

interface Props {
    status: number | string | null | undefined;
    listStatus: StatusItem[];
    defaultText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    defaultText: '-',
});

const styleVariants = {
    default: {
        color: '#717680',
        bgColor: '#F5F5F5',
        borderColor: '#D5D7DA',
        dotColor: '#A4A7AE',
    },

    info: {
        color: '#1570EF',
        bgColor: '#EFF8FF',
        borderColor: '#B2DDFF',
        dotColor: '#1570EF',
    },

    success: {
        color: '#12B76A',
        bgColor: '#ECFDF3',
        borderColor: '#A6F4C5',
        dotColor: '#12B76A',
    },

    warning: {
        color: '#F79009',
        bgColor: '#FFFAEB',
        borderColor: '#FEDF89',
        dotColor: '#F79009',
    },

    danger: {
        color: '#F04438',
        bgColor: '#FEF3F2',
        borderColor: '#FECDCA',
        dotColor: '#F04438',
    },

    accent: {
        color: '#9E77ED',
        bgColor: '#F9F5FF',
        borderColor: '#E9D7FE',
        dotColor: '#9E77ED',
    },
} as const;

const currentStatus = computed(() =>
    props.listStatus.find(
        item => item.value === props.status,
    ),
);

const currentVariant = computed(() => {
    const variant =
        currentStatus.value?.variant ?? 'default';

    return styleVariants[variant];
});

const tagStyle = computed<CSSProperties>(() => ({
    color: currentVariant.value.color,
    backgroundColor: currentVariant.value.bgColor,
    border: `1px solid ${currentVariant.value.borderColor}`,
}));
</script>

<style scoped>
.status-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    min-height: 24px;
    padding: 0 10px;

    border-radius: 9999px;
    box-sizing: border-box;

    font-size: 12px;
    font-weight: 500;
    line-height: 20px;

    white-space: nowrap;
}

.status-dot {
    width: 8px;
    height: 8px;

    border-radius: 50%;
    flex-shrink: 0;
}
</style>