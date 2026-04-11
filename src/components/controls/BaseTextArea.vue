<template>
    <div class="base-textarea-wrapper">
        <label v-if="label" class="base-textarea-label">{{ label }}</label>
        <div class="base-textarea-container">
            <textarea
                class="base-textarea"
                :class="[
                    sizeClass,
                    {
                        'is-readonly': readonly,
                    },
                ]"
                :value="normalizedValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                :rows="rows"
                v-bind="$attrs"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @change="onChange"
            ></textarea>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type TextareaSize = "sm" | "md" | "lg";

interface Props {
    modelValue?: string | number | null;
    label?: string;
    size?: TextareaSize;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: "",
    label: "",
    size: "md",
    placeholder: "",
    disabled: false,
    readonly: false,
    rows: 3,
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
    const target = event.target as HTMLTextAreaElement;
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
@use "@/assets/styles/variable" as *;

.base-textarea-wrapper {
    width: 100%;
}

.base-textarea-label {
    display: block;
    margin-bottom: 10px;
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    color: $color-text-black;
    line-height: 1;
}

.base-textarea-container {
    width: 100%;
}

.base-textarea {
    width: 100%;
    padding: 10px 12px;
    border: $input-border;
    border-radius: $control-border-radius;
    background-color: #ffffff;
    color: $color-text-black;
    font-family: $font-family-base;
    font-size: $font-size-base;
    line-height: 1.4;
    outline: none;
    resize: vertical;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease;

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
    min-height: 70px;
}

.size-md {
    min-height: 90px;
}

.size-lg {
    min-height: 120px;
}
</style>
