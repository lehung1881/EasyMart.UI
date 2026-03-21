<template>
    <div class="base-radio-group" :class="directionClass" role="radiogroup">
        <BaseRadio
            v-for="option in options"
            :key="optionKeyPrefix + option.value.toString()"
            :model-value="modelValue"
            :value="option.value"
            :label="option.label"
            :name="resolvedName"
            :size="size"
            :disabled="resolveOptionDisabled(option)"
            @update:model-value="onUpdateModelValue"
            @change="onChange"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import BaseRadio from "@/components/base/BaseRadio.vue";

type RadioValue = string | number | boolean;
type RadioModelValue = RadioValue | null;
type RadioSize = "sm" | "md" | "lg";
type RadioDirection = "row" | "column";

interface BaseRadioOption {
    label: string;
    value: RadioValue;
    disabled?: boolean;
}

interface Props {
    modelValue: RadioModelValue;
    options: BaseRadioOption[];
    name?: string;
    size?: RadioSize;
    disabled?: boolean;
    direction?: RadioDirection;
}

const props = withDefaults(defineProps<Props>(), {
    name: "",
    size: "md",
    disabled: false,
    direction: "row",
});

const emit = defineEmits<{
    (event: "update:modelValue", value: RadioValue): void;
    (event: "change", value: Event): void;
}>();

const generatedId = useId();
const optionKeyPrefix = `base-radio-group-${generatedId}-`;
const resolvedName = computed(() => props.name || `base-radio-group-${generatedId}`);
const directionClass = computed(() => `direction-${props.direction}`);

/**
 * Phát ra giá trị model đã cập nhật từ radio con.
 * @param value Giá trị radio đã chọn.
 * @returns Không có giá trị trả về.
 */
function onUpdateModelValue(value: RadioValue): void {
    emit("update:modelValue", value);
}

/**
 * Chuyển tiếp sự kiện thay đổi từ radio con.
 * @param event Sự kiện thay đổi từ input radio.
 * @returns Không có giá trị trả về.
 */
function onChange(event: Event): void {
    emit("change", event);
}

/**
 * Giải quyết trạng thái vô hiệu hóa cho từng tùy chọn bằng cách sử dụng cài đặt nhóm và mục.
 * @param option Tùy chọn radio để đánh giá.
 * @returns True khi tùy chọn nên bị vô hiệu hóa.
 */
function resolveOptionDisabled(option: BaseRadioOption): boolean {
    return Boolean(props.disabled || option.disabled);
}
</script>

<style scoped lang="scss">
.base-radio-group {
    display: inline-flex;
}

.direction-row {
    flex-direction: row;
    align-items: center;
    gap: 30px;
}

.direction-column {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
}
</style>
