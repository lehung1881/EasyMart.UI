<template>
    <div class="base-input-wrapper">
        <label v-if="label" class="base-input-label">{{ label }}</label>
        <div class="base-input-container">
            <input
                :type="type"
                class="base-input"
                :class="[
                    sizeClass,
                    {
                        'is-readonly': readonly,
                        'has-left-icon': $slots['left-icon'],
                        'has-right-icon': $slots['right-icon'],
                    },
                ]"
                :value="normalizedValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                v-bind="$attrs"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @change="onChange"
            />
            <div v-if="$slots['left-icon']" class="left-icon">
                <slot name="left-icon"></slot>
            </div>
            <div v-if="$slots['right-icon']" class="right-icon">
                <slot name="right-icon"></slot>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type InputSize = "sm" | "md" | "lg";

interface Props {
    modelValue?: string | number | null;
    label?: string;
    type?: string;
    size?: InputSize;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: "",
    label: "",
    type: "text",
    size: "md",
    placeholder: "",
    disabled: false,
    readonly: false,
});

const emit = defineEmits<{
    (event: "update:modelValue", value: string): void;
    (event: "focus", value: FocusEvent): void;
    (event: "blur", value: FocusEvent): void;
    (event: "change", value: Event): void;
}>();

const sizeClass = computed(() => `size-${props.size}`);
const normalizedValue = computed(() => (props.modelValue ?? "").toString());

function onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    emit("update:modelValue", target.value);
}

function onFocus(event: FocusEvent): void {
    emit("focus", event);
}

function onBlur(event: FocusEvent): void {
    emit("blur", event);
}

function onChange(event: Event): void {
    emit("change", event);
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/base" as *;

.base-input-wrapper {
    width: 100%;
}

.base-input-label {
    display: block;
    margin-bottom: 10px;
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    color: $color-text-black;
    line-height: 1;
}

.base-input-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.base-input {
    flex: 1;
    width: 100%;
    padding: 0 12px;
    border: $input-border;
    border-radius: 4px;
    background-color: #ffffff;
    color: $color-text-black;
    font-family: $font-family-base;
    font-size: $font-size-base;
    line-height: 1;
    outline: none;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease;

    &.has-right-icon {
        padding-right: 30px;
    }

    &.has-left-icon {
        padding-left: 30px;
    }

    &::placeholder {
        color: #9ca3af;
    }

    &:hover:not(:disabled):not(.is-readonly) {
        border-color: $primary-color;
    }

    &:focus-visible:not(:disabled):not(.is-readonly) {
        border-color: $primary-color;
    }

    &:disabled {
        border-color: #e7e8e9;
        background-color: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
    }

    &:-webkit-autofill {
        -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
        -webkit-text-fill-color: $color-text-black !important;
    }

    &:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
        -webkit-text-fill-color: $color-text-black !important;
        border-color: $primary-color !important;
    }
}

.is-readonly {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: default;
}

.size-sm {
    height: $input-height-sm;
}

.size-md {
    height: $input-height-md;
}

.size-lg {
    height: $input-height-lg;
}
.right-icon {
    position: absolute;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 32px;
}

.left-icon {
    position: absolute;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 32px;
}
</style>
