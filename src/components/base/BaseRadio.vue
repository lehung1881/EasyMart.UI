<template>
    <label class="base-radio" :class="[sizeClass, { disabled }]" :for="resolvedId">
        <input
            :id="resolvedId"
            class="base-radio__input"
            type="radio"
            :name="name"
            :value="value"
            :checked="isChecked"
            :disabled="disabled"
            @change="onChange"
        />
        <span class="base-radio__circle" aria-hidden="true">
            <span class="base-radio__dot" />
        </span>
        <span class="base-radio__label">
            <slot name="label">{{ label }}</slot>
        </span>
    </label>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";

type RadioValue = string | number | boolean;
type RadioModelValue = RadioValue | null;
type RadioSize = "sm" | "md" | "lg";

interface Props {
    modelValue: RadioModelValue;
    value: RadioValue;
    label?: string;
    name?: string;
    size?: RadioSize;
    disabled?: boolean;
    id?: string;
}

const props = withDefaults(defineProps<Props>(), {
    label: "",
    name: "",
    size: "md",
    disabled: false,
    id: "",
});

const emit = defineEmits<{
    (event: "update:modelValue", value: RadioValue): void;
    (event: "change", value: Event): void;
}>();

const generatedId = useId();
const resolvedId = computed(() => props.id || `base-radio-${generatedId}`);
const sizeClass = computed(() => `size-${props.size}`);
const isChecked = computed(() => props.modelValue === props.value);

/**
 * Xử lý sự kiện thay đổi của radio và phát ra giá trị model đã cập nhật.
 * @param event Sự kiện thay đổi từ input radio.
 * @returns Không có giá trị trả về.
 */
function onChange(event: Event): void {
    if (props.disabled) return;
    emit("update:modelValue", props.value);
    emit("change", event);
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.base-radio {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    font-family: $font-family-base;
    font-size: $font-size-base;
    color: $color-text-black;
}

.base-radio__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.base-radio__circle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: $input-border;
    border-radius: 50%;
    background: #ffffff;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
}

.base-radio__dot {
    border-radius: 50%;
    background-color: $primary-color;
    opacity: 0;
    transform: scale(0.75);
    transition:
        opacity 0.15s ease,
        transform 0.15s ease;
}

.base-radio__label {
    line-height: 1.2;
}

.base-radio__input:checked + .base-radio__circle {
    border-color: $primary-color;
}

.base-radio__input:checked + .base-radio__circle .base-radio__dot {
    opacity: 1;
    transform: scale(1);
}

.base-radio__input:focus-visible + .base-radio__circle {
    outline: 2px solid rgba($primary-color, 0.3);
    outline-offset: 2px;
}

.base-radio.disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

.size-sm .base-radio__circle {
    width: 16px;
    height: 16px;
}

.size-sm .base-radio__dot {
    width: 8px;
    height: 8px;
}

.size-md .base-radio__circle {
    width: 18px;
    height: 18px;
}

.size-md .base-radio__dot {
    width: 10px;
    height: 10px;
}

.size-lg .base-radio__circle {
    width: 20px;
    height: 20px;
}

.size-lg .base-radio__dot {
    width: 12px;
    height: 12px;
}
</style>
