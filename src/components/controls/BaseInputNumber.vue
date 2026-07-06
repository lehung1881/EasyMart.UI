<template>
    <div class="base-input-number-wrapper">
        <label v-if="label" class="base-input-number-label">{{ label }}</label>
        <div class="base-input-number-container">
            <input
                ref="inputRef"
                type="text"
                class="base-input-number"
                :class="[
                    sizeClass,
                    {
                        'is-readonly': readonly,
                        'has-left-icon': $slots['left-icon'],
                        'has-right-icon': $slots['right-icon'],
                    },
                ]"
                :value="displayValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readonly"
                inputmode="decimal"
                v-bind="$attrs"
                @keydown="onKeydown"
                @input="onInput"
                @focus="onFocus"
                @blur="onBlur"
                @change="onChange"
                @paste="onPaste"
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
import { computed, ref, watch, nextTick } from "vue";
import { formatData } from "@/commons/formatData";
import { FormatType, type FormatTypeType } from "@/constants";

type InputSize = "sm" | "md" | "lg";

interface Props {
    modelValue?: number | string | null;
    label?: string;
    size?: InputSize;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    formatType?: FormatTypeType;
    maxDecimals?: number;
    min?: number | null;
    max?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    label: "",
    size: "md",
    placeholder: "",
    disabled: false,
    readonly: false,
    formatType: FormatType.Quantity,
    maxDecimals: 2,
    min: -999999999999999,
    max: 999999999999999,
});

const emit = defineEmits<{
    (event: "update:modelValue", value: number | null): void;
    (event: "focus", value: FocusEvent): void;
    (event: "blur", value: FocusEvent): void;
    (event: "change", value: number | null): void;
    (event: "input", value: number | null): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const sizeClass = computed(() => `size-${props.size}`);
const isFocused = ref(false);

/** Không cho nhập số âm nếu min >= 0 */
const allowNegative = computed(() => {
    return props.min == null || props.min < 0;
});

// ============================================================
// Các hàm tiện ích format
// ============================================================

const THOUSANDS_SEP = ".";
const DECIMAL_SEP = ",";

/**
 * Format số realtime khi đang nhập.
 * Ví dụ: "1234567" -> "1.234.567"
 *         "1234567,89" -> "1.234.567,89"
 */
function formatWhileTyping(raw: string): string {
    if (!raw || raw === "-") return raw;

    const isNegative = raw.startsWith("-");
    let value = isNegative ? raw.slice(1) : raw;

    // Tách phần nguyên và phần thập phân
    const decimalIdx = value.indexOf(DECIMAL_SEP);
    let integerPart = decimalIdx !== -1 ? value.slice(0, decimalIdx) : value;
    const fractionalPart = decimalIdx !== -1 ? value.slice(decimalIdx) : "";

    // Xóa leading zeros (nhưng giữ "0" đơn lẻ)
    integerPart = integerPart.replace(/^0+(?=\d)/, "");

    // Thêm dấu phân cách hàng nghìn
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEP);

    return `${isNegative ? "-" : ""}${integerPart}${fractionalPart}`;
}

/**
 * Loại bỏ format, trả về chuỗi số thuần (dùng dấu chấm làm decimal cho JS)
 * Ví dụ: "1.234.567,89" -> "1234567.89"
 */
function stripFormat(formatted: string): string {
    if (!formatted) return "";
    let value = formatted;
    // Xóa dấu phân cách hàng nghìn
    value = value.replaceAll(THOUSANDS_SEP, "");
    // Chuyển dấu phẩy thập phân thành dấu chấm cho JS
    value = value.replace(DECIMAL_SEP, ".");
    return value;
}

/**
 * Lấy chuỗi raw (chỉ chứa số, dấu trừ, dấu phẩy thập phân)
 * từ chuỗi đã format
 */
function getRawFromFormatted(formatted: string): string {
    if (!formatted) return "";
    // Xóa dấu phân cách hàng nghìn, giữ lại số, dấu trừ, dấu phẩy
    return formatted.replaceAll(THOUSANDS_SEP, "");
}

// ============================================================
// Computed: displayValue
// ============================================================

const formattedValue = computed(() => {
    if (props.modelValue == null || props.modelValue === "") return "";
    const num = Number(props.modelValue);
    if (Number.isNaN(num)) return "";

    return props.formatType === FormatType.Currency ? formatData.formatCurrency(num) : formatData.formatQuantity(num);
});

/** Giá trị hiển thị khi đang focus: format realtime */
const focusDisplayValue = ref("");

const displayValue = computed(() => (isFocused.value ? focusDisplayValue.value : formattedValue.value));

// ============================================================
// Allowed keys check
// ============================================================

const ALLOWED_KEYS = new Set([
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
]);

function onKeydown(event: KeyboardEvent): void {
    const key = event.key;

    // Cho phép các phím điều hướng, xóa, Ctrl/Cmd shortcuts
    if (ALLOWED_KEYS.has(key) || event.ctrlKey || event.metaKey) {
        return;
    }

    // Chặn dấu trừ nếu không cho phép số âm
    if (key === "-") {
        if (!allowNegative.value) {
            event.preventDefault();
            return;
        }
        const target = event.target as HTMLInputElement;
        const raw = getRawFromFormatted(target.value);
        if (target.selectionStart !== 0 || raw.includes("-")) {
            event.preventDefault();
        }
        return;
    }

    // Cho phép dấu phẩy hoặc dấu chấm làm decimal separator
    if (key === "," || key === ".") {
        const target = event.target as HTMLInputElement;
        const raw = getRawFromFormatted(target.value);
        // Chỉ cho phép 1 dấu thập phân
        if (raw.includes(DECIMAL_SEP)) {
            event.preventDefault();
        }
        return;
    }

    // Chỉ cho phép số 0-9
    if (!/^\d$/.test(key)) {
        event.preventDefault();
        return;
    }

    // Kiểm tra giới hạn số chữ số thập phân
    if (props.maxDecimals != null) {
        const target = event.target as HTMLInputElement;
        const raw = getRawFromFormatted(target.value);
        const decIdx = raw.indexOf(DECIMAL_SEP);
        if (decIdx !== -1) {
            const cursorPos = target.selectionStart ?? 0;
            // Tính vị trí cursor trong raw string
            const textBeforeCursor = target.value.slice(0, cursorPos);
            const rawBeforeCursor = textBeforeCursor.replaceAll(THOUSANDS_SEP, "");
            const rawCursorPos = rawBeforeCursor.length;

            // Nếu cursor ở sau dấu thập phân và đã đủ số chữ số
            const fractionalPart = raw.slice(decIdx + 1);
            if (rawCursorPos > decIdx && fractionalPart.length >= props.maxDecimals) {
                // Cho phép nếu có selection (sẽ thay thế)
                if (target.selectionStart === target.selectionEnd) {
                    event.preventDefault();
                }
            }
        }
    }
}

// ============================================================
// Xử lý paste
// ============================================================

function onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData("text") ?? "";

    // Normalize: chấp nhận cả dấu chấm và dấu phẩy
    let cleaned = pastedText.trim().replace(/\s+/g, "");
    // Xóa ký tự không hợp lệ
    cleaned = cleaned.replace(/[^0-9,.\-]/g, "");

    if (!cleaned) return;

    // Xóa dấu trừ nếu không cho phép số âm
    if (!allowNegative.value) {
        cleaned = cleaned.replace(/-/g, "");
    } else {
        if (cleaned.includes("-")) {
            cleaned = `${cleaned.startsWith("-") ? "-" : ""}${cleaned.replace(/-/g, "")}`;
        }
    }

    if (!cleaned) return;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalPos = Math.max(lastComma, lastDot);

    let rawNumber: string;
    if (decimalPos !== -1) {
        const intPart = cleaned.slice(0, decimalPos).replace(/[.,]/g, "");
        let fracPart = cleaned.slice(decimalPos + 1).replace(/[.,]/g, "");
        if (props.maxDecimals != null) {
            fracPart = fracPart.slice(0, props.maxDecimals);
        }
        rawNumber = `${intPart}${DECIMAL_SEP}${fracPart}`;
    } else {
        rawNumber = cleaned.replace(/[.,]/g, "");
    }

    // Format và cập nhật
    focusDisplayValue.value = formatWhileTyping(rawNumber);
    emitNumericValue(rawNumber);

    // Đặt cursor ở cuối
    nextTick(() => {
        if (inputRef.value) {
            const len = inputRef.value.value.length;
            inputRef.value.setSelectionRange(len, len);
        }
    });
}

// ============================================================
// Input handler: format realtime
// ============================================================

function emitNumericValue(raw: string): void {
    // raw ở đây dùng DECIMAL_SEP là dấu phẩy
    if (!raw || raw === "-" || raw === DECIMAL_SEP || raw === `-${DECIMAL_SEP}`) {
        emit("update:modelValue", null);
        return;
    }

    const jsNumber = stripFormat(formatWhileTyping(raw));
    const numericValue = Number(jsNumber);

    if (Number.isNaN(numericValue)) {
        emit("update:modelValue", null);
        return;
    }

    // Clamp theo min/max
    let finalValue = numericValue;
    if (props.min != null && finalValue < props.min) finalValue = props.min;
    if (props.max != null && finalValue > props.max) finalValue = props.max;

    emit("update:modelValue", finalValue);
    emit("change", finalValue);
}

function onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const cursorPos = target.selectionStart ?? 0;
    const oldValue = target.value;

    // Lấy raw value (xóa dấu phân cách hàng nghìn)
    let raw = getRawFromFormatted(oldValue);

    // Chuyển dấu chấm nhập vào thành dấu phẩy (decimal separator)
    // Người dùng có thể nhập "." nhưng ta dùng "," làm decimal
    raw = raw.replace(".", DECIMAL_SEP);

    // Loại bỏ dấu trừ nếu không cho phép
    if (!allowNegative.value) {
        raw = raw.replace(/-/g, "");
    }

    const decIdx = raw.indexOf(DECIMAL_SEP);
    if (decIdx !== -1 && props.maxDecimals != null) {
        const fracPart = raw.slice(decIdx + 1);
        if (fracPart.length > props.maxDecimals) {
            raw = raw.slice(0, decIdx + 1 + props.maxDecimals);
        }
    }

    const formatted = formatWhileTyping(raw);
    focusDisplayValue.value = formatted;

    emitNumericValue(raw);

    nextTick(() => {
        if (!inputRef.value) return;

        const oldSepsBefore = (oldValue.slice(0, cursorPos).match(/\./g) || []).length;
        const newFormatted = inputRef.value.value;

        const rawCursorPos = cursorPos - oldSepsBefore;

        let newCursorPos = 0;
        let rawCount = 0;
        for (let i = 0; i < newFormatted.length; i++) {
            if (rawCount === rawCursorPos) {
                newCursorPos = i;
                break;
            }
            if (newFormatted[i] !== THOUSANDS_SEP) {
                rawCount++;
            }
            newCursorPos = i + 1;
        }

        inputRef.value.setSelectionRange(newCursorPos, newCursorPos);
    });
}

/**
 * Convert giá trị hiện tại của input thành number | null để emit ra ngoài.
 * Lấy từ modelValue đã được clamp thay vì parse lại raw string.
 */
function getEmitValue(): number | null {
    if (props.modelValue == null || props.modelValue === "") return null;
    const num = Number(props.modelValue);
    return Number.isNaN(num) ? null : num;
}

// ============================================================
// Focus / Blur / Change
// ============================================================

function onFocus(event: FocusEvent): void {
    isFocused.value = true;

    if (props.modelValue == null || props.modelValue === "") {
        focusDisplayValue.value = "";
    } else {
        const num = Number(props.modelValue);
        if (Number.isNaN(num)) {
            focusDisplayValue.value = "";
        } else {
            const raw = String(num).replace(".", DECIMAL_SEP);
            focusDisplayValue.value = formatWhileTyping(raw);
        }
    }

    nextTick(() => {
        if (inputRef.value) {
            inputRef.value.select();
        }
    });

    emit("focus", event);
}

function onBlur(event: FocusEvent): void {
    isFocused.value = false;

    if (props.modelValue != null && props.modelValue !== "") {
        const num = Number(props.modelValue);
        if (!Number.isNaN(num)) {
            let clamped = num;
            if (props.min != null && clamped < props.min) clamped = props.min;
            if (props.max != null && clamped > props.max) clamped = props.max;
            if (clamped !== num) {
                emit("update:modelValue", clamped);
            }
        }
    }

    emit("blur", event);
}

function onChange(_event: Event): void {
    emit("change", getEmitValue());
}

// ============================================================
// Watch modelValue
// ============================================================

watch(
    () => props.modelValue,
    (value) => {
        if (isFocused.value) return;
        if (value == null || value === "") {
            focusDisplayValue.value = "";
            return;
        }
        const num = Number(value);
        if (Number.isNaN(num)) {
            focusDisplayValue.value = "";
        } else {
            const raw = String(num).replace(".", DECIMAL_SEP);
            focusDisplayValue.value = formatWhileTyping(raw);
        }
    },
    { immediate: true },
);
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.base-input-number-wrapper {
    width: 100%;
}

.base-input-number-label {
    display: block;
    margin-bottom: 10px;
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    color: $color-text-black;
    line-height: 1;
}

.base-input-number-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.base-input-number {
    flex: 1;
    width: 100%;
    padding: 0 12px;
    border: $input-border;
    border-radius: $control-border-radius;
    background-color: #ffffff;
    color: $color-text-black;
    font-family: $font-family-base;
    font-weight: 500;
    font-size: $input-font-size;
    line-height: 1;
    text-align: right;
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
