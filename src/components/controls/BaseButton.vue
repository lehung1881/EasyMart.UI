<template>
    <button
        :type="type"
        class="base-button"
        :class="[sizeClass, variantClass, { 'no-select': noSelect, 'base-button--icon-only': isIconOnly }]"
        :disabled="disabled"
        v-bind="$attrs"
        @click="onClick"
    >
        <span v-if="leftIconClass" class="base-button__icon" :class="leftIconClass" aria-hidden="true"></span>
        <slot />
        <span v-if="rightIconClass" class="base-button__icon" :class="rightIconClass" aria-hidden="true"></span>
    </button>
</template>

<script setup lang="ts">
import { computed, useSlots, type VNode } from "vue";

type ButtonSize = "sm" | "md" | "lg" | "xl" | "xxl";
type ButtonVariant = "normal" | "primary" | "outline-primary" | "dash-primary" | "dash-normal";

interface Props {
    size?: ButtonSize;
    variant?: ButtonVariant;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    noSelect?: boolean;
    icon?: string;
    iconLeft?: string;
    iconRight?: string;
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
    variant: "normal",
    type: "button",
    disabled: false,
    noSelect: true,
    icon: "",
    iconLeft: "",
    iconRight: "",
});

const emit = defineEmits<{
    (event: "click", value: MouseEvent): void;
}>();

const slots = useSlots();

const sizeClass = computed(() => `size-${props.size}`);
const variantClass = computed(() => `variant-${props.variant}`);
const leftIconClass = computed(() => props.iconLeft || props.icon);
const rightIconClass = computed(() => props.iconRight);
const hasIcon = computed(() => Boolean(leftIconClass.value || rightIconClass.value));

/**
 * Trích xuất text hiển thị từ VNode theo cách đệ quy.
 * @param node VNode cần đọc nội dung text.
 * @returns Chuỗi text thu được từ node.
 */
function extractTextFromVNode(node: VNode): string {
    if (typeof node.children === "string") return node.children;

    if (Array.isArray(node.children)) {
        return node.children
            .map((child) => {
                if (typeof child === "string") return child;
                if (typeof child === "object" && child !== null) return extractTextFromVNode(child as VNode);
                return "";
            })
            .join("");
    }

    return "";
}

/**
 * Kiểm tra slot mặc định có text hiển thị hay không.
 * @returns `true` nếu có text, ngược lại `false`.
 */
function hasDefaultSlotText(): boolean {
    const nodes = slots.default?.() ?? [];
    const content = nodes
        .map((node) => extractTextFromVNode(node))
        .join("")
        .trim();
    return content.length > 0;
}

const isIconOnly = computed(() => hasIcon.value && !hasDefaultSlotText());

/**
 * Xử lý sự kiện click của nút.
 * @param event Sự kiện click từ DOM.
 * @returns Không trả về dữ liệu.
 */
function onClick(event: MouseEvent): void {
    if (props.disabled) return;
    emit("click", event);
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

$icon-only-width-offset: 2px;

.base-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 70px;
    padding: 0 $button-padding-x;
    border-radius: $control-border-radius;
    border: 1px solid transparent;
    // font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    white-space: nowrap;
    transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;

    &:focus-visible {
        outline: 2px solid rgba($primary-color, 0.3);
        outline-offset: 2px;
    }

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
}

.base-button__icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.base-button--icon-only {
    min-width: 0;
    padding: 0;
    gap: 0;
}

.base-button--icon-only.size-sm {
    min-width: calc(#{$button-height-sm} + #{$icon-only-width-offset});
}

.base-button--icon-only.size-md {
    min-width: calc(#{$button-height-md} + #{$icon-only-width-offset});
}

.base-button--icon-only.size-lg {
    min-width: calc(#{$button-height-lg} + #{$icon-only-width-offset});
}

.base-button--icon-only.size-xl {
    min-width: calc(#{$button-height-xl} + #{$icon-only-width-offset});
}

.base-button--icon-only.size-xxl {
    min-width: calc(#{$button-height-xxl} + #{$icon-only-width-offset});
}

.no-select {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

.size-sm {
    height: $button-height-sm;
}

.size-md {
    height: $button-height-md;
}

.size-lg {
    height: $button-height-lg;
}

.size-xl {
    height: $button-height-xl;
}

.size-xxl {
    height: $button-height-xxl;
}

.variant-normal {
    background-color: #ffffff;
    border-color: #e0e0e0;
    color: $color-text-black;

    &:hover:not(:disabled) {
        background-color: #f9fafb;
    }
}

.variant-primary {
    background-color: $primary-color;
    border-color: $primary-color;
    color: #ffffff;

    &:hover:not(:disabled) {
        background-color: darken($primary-color, 6%);
        border-color: darken($primary-color, 6%);
    }
}

.variant-outline-primary {
    background-color: #ffffff;
    border-color: $primary-color;
    color: $primary-color;

    &:hover:not(:disabled) {
        background-color: rgba($primary-color, 0.08);
    }
}

.variant-dash-primary {
    background-color: #ffffff;
    border: 1px dashed $primary-color;
    color: $primary-color;

    &:hover:not(:disabled) {
        background-color: rgba($primary-color, 0.08);
    }
}

.variant-dash-normal {
    background-color: #ffffff;
    border: 1px dashed #e0e0e0;
    color: $color-text-black;

    &:hover:not(:disabled) {
        background-color: #f9fafb;
    }
}
</style>
