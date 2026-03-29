<template>
    <button
        :type="type"
        class="base-button"
        :class="[sizeClass, variantClass, { 'no-select': noSelect }]"
        :disabled="disabled"
        v-bind="$attrs"
        @click="onClick"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

type ButtonSize = "sm" | "md" | "lg" | "xl" | "xxl";
type ButtonVariant = "normal" | "primary" | "outline-primary";

interface Props {
    size?: ButtonSize;
    variant?: ButtonVariant;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    noSelect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
    variant: "normal",
    type: "button",
    disabled: false,
    noSelect: true,
});

const emit = defineEmits<{
    (event: "click", value: MouseEvent): void;
}>();

const sizeClass = computed(() => `size-${props.size}`);
const variantClass = computed(() => `variant-${props.variant}`);

function onClick(event: MouseEvent): void {
    if (props.disabled) return;
    emit("click", event);
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/base" as *;

.base-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 90px;
    padding: 0 $button-padding-x;
    border-radius: 4px;
    border: 1px solid transparent;
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    line-height: 1;
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
</style>
