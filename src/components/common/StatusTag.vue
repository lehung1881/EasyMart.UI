<template>
    <span class="status-tag" :style="tagStyle">
        <span class="status-dot" :style="{ backgroundColor: currentVariant.dotColor }" />

        {{ currentStatus?.text ?? defaultText }}
    </span>
</template>

<script lang="ts">
import { computed, defineComponent, type CSSProperties, type PropType } from "vue";

/**
 * Các kiểu màu trạng thái được hỗ trợ.
 */
export type StatusVariant = "default" | "info" | "success" | "warning" | "danger" | "accent";

/**
 * Định nghĩa một trạng thái hiển thị.
 */
export interface StatusItem {
    /**
     * Giá trị trạng thái.
     */
    value: number | string;

    /**
     * Nội dung hiển thị.
     */
    text: string;

    /**
     * Màu hiển thị của trạng thái.
     * Mặc định: default
     */
    variant?: StatusVariant;
}

/**
 * Danh sách style tương ứng với từng variant.
 */
const STYLE_VARIANTS = {
    default: {
        color: "#717680",
        bgColor: "#F5F5F5",
        borderColor: "#D5D7DA",
        dotColor: "#A4A7AE",
    },

    info: {
        color: "#1570EF",
        bgColor: "#EFF8FF",
        borderColor: "#B2DDFF",
        dotColor: "#1570EF",
    },

    success: {
        color: "#12B76A",
        bgColor: "#ECFDF3",
        borderColor: "#A6F4C5",
        dotColor: "#12B76A",
    },

    warning: {
        color: "#F79009",
        bgColor: "#FFFAEB",
        borderColor: "#FEDF89",
        dotColor: "#F79009",
    },

    danger: {
        color: "#F04438",
        bgColor: "#FEF3F2",
        borderColor: "#FECDCA",
        dotColor: "#F04438",
    },

    accent: {
        color: "#9E77ED",
        bgColor: "#F9F5FF",
        borderColor: "#E9D7FE",
        dotColor: "#9E77ED",
    },
} as const;

/**
 * Component hiển thị trạng thái dưới dạng Tag.
 *
 * Các variant hỗ trợ:
 * - default : Trạng thái mặc định
 * - info    : Thông tin / Đang xử lý
 * - success : Thành công
 * - warning : Cảnh báo
 * - danger  : Lỗi / Từ chối
 * - accent  : Màu nhấn mạnh
 *
 * Ví dụ:
 *
 * const orderStatus = [
 *   {
 *      value: 1,
 *      text: 'Nháp',
 *      variant: 'default'
 *   },
 *   {
 *      value: 2,
 *      text: 'Đang xử lý',
 *      variant: 'info'
 *   }
 * ];
 *
 * <StatusTag
 *      :status="record.Status"
 *      :list-status="orderStatus"
 * />
 */
export default defineComponent({
    name: "StatusTag",

    props: {
        /**
         * Giá trị trạng thái hiện tại.
         */
        status: {
            type: [Number, String] as PropType<number | string | null>,
            default: null,
        },

        /**
         * Danh sách trạng thái hiển thị.
         */
        listStatus: {
            type: Array as PropType<StatusItem[]>,
            default: () => [],
        },

        /**
         * Nội dung hiển thị khi không tìm thấy trạng thái.
         */
        defaultText: {
            type: String,
            default: "-",
        },

        /**
         * Sử dụng bộ trạng thái mặc định được định nghĩa sẵn.
         * Ví dụ:
         * - Inactive
         */
        statusDefault: {
            type: String as PropType<string | null>,
            default: null,
        },
    },

    setup(props) {
        /**
         * Một số bộ trạng thái hệ thống dùng chung.
         */
        const defaultStatus = {
            Inactive: [
                {
                    value: 1,
                    text: "Đang hoạt động",
                    variant: "success",
                },
                {
                    value: 2,
                    text: "Ngừng hoạt động",
                    variant: "danger",
                },
            ],
        } as const;

        /**
         * Trạng thái hiện tại được tìm thấy từ:
         * 1. Bộ trạng thái mặc định
         * 2. Danh sách trạng thái truyền vào
         */
        const currentStatus = computed(() => {
            if (props.statusDefault && props.statusDefault in defaultStatus) {
                return defaultStatus[props.statusDefault].find((item) => item.value === props.status);
            }

            return props.listStatus.find((item) => item.value === props.status);
        });

        /**
         * Variant hiện tại của trạng thái.
         */
        const currentVariant = computed(() => {
            const variant = currentStatus.value?.variant ?? "default";

            return STYLE_VARIANTS[variant];
        });

        /**
         * Style hiển thị cho Tag.
         */
        const tagStyle = computed<CSSProperties>(() => ({
            color: currentVariant.value.color,
            backgroundColor: currentVariant.value.bgColor,
            border: `1px solid ${currentVariant.value.borderColor}`,
        }));

        return {
            currentStatus,
            currentVariant,
            tagStyle,
        };
    },
});
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
