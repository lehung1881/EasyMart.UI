<template>
    <label class="base-checkbox" :class="[sizeClass, { disabled }]" :for="resolvedId">
        <input
            :id="resolvedId"
            class="base-checkbox__input"
            type="checkbox"
            :checked="modelValue"
            :disabled="disabled"
            @change="onChange"
        />
        <div class="base-checkbox__box" aria-hidden="true">
            <svg viewBox="0 0 12 10" fill="none">
                <path
                    d="M1.5 5.5L4.5 8.5L10.5 1.5"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </div>
        <div class="base-checkbox__label">
            <slot name="label">{{ label }}</slot>
        </div>
    </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

type CheckboxSize = "sm" | "md" | "lg";

interface Props {
    modelValue: boolean;
    label?: string;
    size?: CheckboxSize;
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
const resolvedId = computed(() => props.id || `base-checkbox-${generatedId}`);
const sizeClass = computed(() => `size-${props.size}`);

function onChange(event: Event): void {
    if (props.disabled) return;
    const target = event.target as HTMLInputElement;
    emit("update:modelValue", target.checked);
    emit("change", event);
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/base" as *;

.base-checkbox {
    display: inline-flex;
    align-items: end;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    font-family: $font-family-base;
    font-size: $font-size-base;
    color: $color-text-black;
}

.base-checkbox__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.base-checkbox__box {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    border: $input-border;
    border-radius: 2px;
    background: #ffffff;
    color: #ffffff;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;

    svg {
        display: block;
        width: 11px;
        height: 9px;
        opacity: 0;
        transform: scale(0.9);
        transition:
            opacity 0.15s ease,
            transform 0.15s ease;
    }
}

.base-checkbox__label {
    line-height: 14px;
}

.base-checkbox__input:checked + .base-checkbox__box {
    background: $primary-color;
    border-color: $primary-color;
}
.base-checkbox__input:checked + .base-checkbox__box svg {
    opacity: 1;
    transform: scale(1);
}

.base-checkbox__input:focus-visible + .base-checkbox__box {
    outline: 2px solid rgba($primary-color, 0.3);
    outline-offset: 2px;
}

.base-checkbox.disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.size-sm .base-checkbox__box {
    width: 16px;
    height: 16px;
}

.size-md .base-checkbox__box {
    width: 18px;
    height: 18px;
}

.size-lg .base-checkbox__box {
    width: 20px;
    height: 20px;
}
</style>
