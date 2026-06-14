<template>
    <label class="base-switch" :class="[sizeClass, { disabled, checked: modelValue }]" :for="resolvedId">
        <input
            :id="resolvedId"
            class="base-switch__input"
            type="checkbox"
            :checked="modelValue"
            :disabled="disabled"
            @change="onChange"
        />
        <div class="base-switch__track" aria-hidden="true">
            <div class="base-switch__thumb" />
        </div>
        <div class="base-switch__label" v-if="label">
            <slot name="label">{{ label }}</slot>
        </div>
    </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

type SwitchSize = "sm" | "md" | "lg";

interface Props {
    modelValue: boolean;
    label?: string;
    size?: SwitchSize;
    disabled?: boolean;
    id?: string;
}

const props = withDefaults(defineProps<Props>(), {
    label: "",
    size: "md",
    disabled: false,
    id: "",
});

const emit = defineEmits<{
    (event: "update:modelValue", value: boolean): void;
    (event: "change", value: Event): void;
}>();

const generatedId = useId();
const resolvedId = computed(() => props.id || `base-switch-${generatedId}`);
const sizeClass = computed(() => `size-${props.size}`);

function onChange(event: Event): void {
    if (props.disabled) return;
    const target = event.target as HTMLInputElement;
    emit("update:modelValue", target.checked);
    emit("change", event);
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.base-switch {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    font-family: $font-family-base;
    font-size: $font-size-base;
    color: $color-text-black;
}

.base-switch__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.base-switch__track {
    flex-shrink: 0;
    position: relative;
    border-radius: 999px;
    background: #d1d5db;
    border: $input-border;
    transition:
        background-color 0.2s ease,
        border-color 0.2s ease;
}

.base-switch__thumb {
    position: absolute;
    top: 50%;
    transform: translateY(-50%) translateX(2px);
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease;
}

.base-switch__label {
    line-height: 14px;
}

.base-switch__input:checked ~ .base-switch__track {
    background: $primary-color;
    border-color: $primary-color;
}

.base-switch__input:focus-visible ~ .base-switch__track {
    outline: 2px solid rgba($primary-color, 0.3);
    outline-offset: 2px;
}

.base-switch.disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

/* Size: sm */
.size-sm .base-switch__track {
    width: 28px;
    height: 16px;
}
.size-sm .base-switch__thumb {
    width: 10px;
    height: 10px;
}
.size-sm .base-switch__input:checked ~ .base-switch__track .base-switch__thumb {
    transform: translateY(-50%) translateX(14px);
}

/* Size: md */
.size-md .base-switch__track {
    width: 36px;
    height: 20px;
}
.size-md .base-switch__thumb {
    width: 14px;
    height: 14px;
}
.size-md .base-switch__input:checked ~ .base-switch__track .base-switch__thumb {
    transform: translateY(-50%) translateX(18px);
}

/* Size: lg */
.size-lg .base-switch__track {
    width: 44px;
    height: 24px;
}
.size-lg .base-switch__thumb {
    width: 18px;
    height: 18px;
}
.size-lg .base-switch__input:checked ~ .base-switch__track .base-switch__thumb {
    transform: translateY(-50%) translateX(22px);
}
</style>
