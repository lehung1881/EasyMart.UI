<template>
    <div ref="wrapperRef" class="base-datepicker-wrapper">
        <label v-if="label" class="base-datepicker-label">{{ label }}</label>
        <div class="base-datepicker-container">
            <input
                type="text"
                class="base-datepicker"
                :class="[
                    sizeClass,
                    {
                        'is-readonly': readonly,
                        'is-disabled': disabled,
                        'is-open': isOpen,
                    },
                ]"
                :value="inputValue"
                :placeholder="inputPlaceholder"
                :disabled="disabled"
                :readonly="readonly"
                @focus="onInputFocus"
                @input="onManualInput"
                @blur="onManualBlur"
                @keydown.enter.prevent="onManualEnter"
            />

            <button
                type="button"
                class="right-icon default-calendar-icon"
                :disabled="disabled || readonly"
                aria-label="Open calendar"
                @click.stop="toggleCalendar"
            >
                <span class="icon-calendar" aria-hidden="true"></span>
            </button>

            <div v-if="isOpen" class="calendar-popup" role="dialog" aria-modal="false">
                <div class="calendar-header">
                    <div class="nav-group">
                        <button type="button" class="nav-btn" :disabled="!canGoPrevYear" @click="goPrevYear">
                            <span class="icon-nav-prev-year" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="nav-btn" :disabled="!canGoPrev" @click="goPrevMonth">
                            <span class="icon-nav-prev-month" aria-hidden="true"></span>
                        </button>
                    </div>
                    <div class="calendar-title">{{ calendarTitle }}</div>
                    <div class="nav-group">
                        <button type="button" class="nav-btn" :disabled="!canGoNext" @click="goNextMonth">
                            <span class="icon-nav-next-month" aria-hidden="true"></span>
                        </button>
                        <button type="button" class="nav-btn" :disabled="!canGoNextYear" @click="goNextYear">
                            <span class="icon-nav-next-year" aria-hidden="true"></span>
                        </button>
                    </div>
                </div>

                <div class="calendar-weekdays">
                    <span v-for="day in weekDays" :key="day">{{ day }}</span>
                </div>

                <div class="calendar-grid">
                    <button
                        v-for="day in visibleDays"
                        :key="day.key"
                        type="button"
                        class="day-cell"
                        :class="{
                            'is-other-month': day.isOtherMonth,
                            'is-today': day.isToday,
                            'is-selected': day.isSelected,
                            'is-disabled': day.isDisabled,
                        }"
                        :disabled="day.isDisabled"
                        @click="selectDay(day.date)"
                    >
                        {{ day.date.getDate() }}
                    </button>
                </div>

                <div class="calendar-footer">
                    <button type="button" class="footer-btn" :disabled="!canPickToday" @click="pickToday">
                        Hôm nay
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

type InputSize = "sm" | "md" | "lg";

interface Props {
    modelValue?: Date | null;
    label?: string;
    size?: InputSize;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    min?: string;
    max?: string;
    enableTime?: boolean;
}

interface CalendarDay {
    key: string;
    date: Date;
    isOtherMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    label: "",
    size: "md",
    placeholder: "",
    disabled: false,
    readonly: false,
    min: "",
    max: "",
    enableTime: false,
});

const emit = defineEmits<{
    (event: "update:modelValue", value: Date | null): void;
    (event: "focus", value: FocusEvent): void;
    (event: "blur", value: FocusEvent): void;
    (event: "change", value: Date | null): void;
    (event: "input", value: Date | null): void;
}>();

const wrapperRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const viewMonth = ref(0);
const viewYear = ref(0);
const inputValue = ref("");

const sizeClass = computed(() => `size-${props.size}`);
const inputPlaceholder = computed(() =>
    props.placeholder ? props.placeholder : props.enableTime ? "dd/mm/yyyy HH:mm:ss" : "dd/mm/yyyy",
);

const selectedDate = computed(() => normalizeModelDateValue(props.modelValue, props.enableTime));
const minDate = computed(() => parseDateString(props.min));
const maxDate = computed(() => parseDateString(props.max));

const calendarTitle = computed(() => {
    const month = `${viewMonth.value + 1}`.padStart(2, "0");
    return `Tháng ${month}/${viewYear.value}`;
});

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const visibleDays = computed<CalendarDay[]>(() => {
    const firstDay = new Date(viewYear.value, viewMonth.value, 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(viewYear.value, viewMonth.value, 1 - offset);
    const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
    const totalRows = Math.ceil((offset + daysInMonth) / 7);
    const totalCells = totalRows * 7;

    const days: CalendarDay[] = [];
    for (let i = 0; i < totalCells; i += 1) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const normalized = normalizeDate(date);
        days.push({
            key: `${formatDateValue(normalized)}-${i}`,
            date: normalized,
            isOtherMonth: normalized.getMonth() !== viewMonth.value,
            isToday: isSameDate(normalized, normalizeDate(new Date())),
            isSelected: selectedDate.value ? isSameDate(normalized, selectedDate.value) : false,
            isDisabled: isDateDisabled(normalized),
        });
    }

    return days;
});

const canGoPrev = computed(() => {
    if (!minDate.value) {
        return true;
    }

    const prevMonth = new Date(viewYear.value, viewMonth.value - 1, 1);
    const monthEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    return monthEnd >= minDate.value;
});

const canGoNext = computed(() => {
    if (!maxDate.value) {
        return true;
    }

    const nextMonth = new Date(viewYear.value, viewMonth.value + 1, 1);
    return nextMonth <= new Date(maxDate.value.getFullYear(), maxDate.value.getMonth(), maxDate.value.getDate());
});

const canGoPrevYear = computed(() => {
    if (!minDate.value) {
        return true;
    }

    const prevYear = new Date(viewYear.value - 1, viewMonth.value, 1);
    const monthEnd = new Date(prevYear.getFullYear(), prevYear.getMonth() + 1, 0);
    return monthEnd >= minDate.value;
});

const canGoNextYear = computed(() => {
    if (!maxDate.value) {
        return true;
    }

    const nextYear = new Date(viewYear.value + 1, viewMonth.value, 1);
    return nextYear <= new Date(maxDate.value.getFullYear(), maxDate.value.getMonth(), maxDate.value.getDate());
});

const canPickToday = computed(() => !isDateDisabled(normalizeDate(new Date())));

watch(
    selectedDate,
    (value) => {
        const fallback = normalizeDate(new Date());
        const pivot = value || fallback;
        viewMonth.value = pivot.getMonth();
        viewYear.value = pivot.getFullYear();
        inputValue.value = value ? formatDisplayDate(value, props.enableTime) : "";
    },
    { immediate: true },
);

onMounted(() => {
    document.addEventListener("mousedown", onClickOutside);
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", onClickOutside);
});

/**
 * Đóng hoặc mở lịch theo trạng thái hiện tại của component.
 * @returns Không trả về giá trị.
 */
function toggleCalendar(): void {
    if (props.disabled || props.readonly) {
        return;
    }

    isOpen.value ? closeCalendar() : openCalendar();
}

/**
 * Mở popup lịch khi control không bị disable/readonly.
 * @returns Không trả về giá trị.
 */
function openCalendar(): void {
    if (props.disabled || props.readonly) {
        return;
    }

    isOpen.value = true;
}

/**
 * Đóng popup lịch.
 * @returns Không trả về giá trị.
 */
function closeCalendar(): void {
    isOpen.value = false;
}

/**
 * Xử lý khi input nhận focus để mở lịch và phát sự kiện focus ra ngoài.
 * @param event Sự kiện focus của input.
 * @returns Không trả về giá trị.
 */
function onInputFocus(event: FocusEvent): void {
    openCalendar();
    emit("focus", event);
}

/**
 * Xử lý nhập tay trên input và chuẩn hóa định dạng ngày tháng.
 * @param event Sự kiện input của thẻ input.
 * @returns Không trả về giá trị.
 */
function onManualInput(event: Event): void {
    const inputEvent = event as InputEvent;
    const target = event.target as HTMLInputElement;
    const sanitized = sanitizeDateTypingInput(target.value, inputEvent.inputType, props.enableTime);
    inputValue.value = sanitized;
    target.value = sanitized;
}

/**
 * Xử lý phím Enter để commit giá trị người dùng đang nhập.
 * @returns Không trả về giá trị.
 */
function onManualEnter(): void {
    commitManualValue();
}

/**
 * Xử lý blur để commit giá trị và phát sự kiện blur ra ngoài.
 * @param event Sự kiện blur của input.
 * @returns Không trả về giá trị.
 */
function onManualBlur(event: FocusEvent): void {
    commitManualValue();
    emit("blur", event);
}

/**
 * Xác thực và đồng bộ giá trị nhập tay về định dạng chuẩn yyyy-MM-dd.
 * @returns Không trả về giá trị.
 */
function commitManualValue(): void {
    const raw = inputValue.value.trim();
    if (!raw) {
        emitAll(null);
        return;
    }

    const parsed = parseDateWithAutoComplete(raw, props.enableTime);
    if (!parsed || isDateDisabled(parsed)) {
        inputValue.value = selectedDate.value ? formatDisplayDate(selectedDate.value, props.enableTime) : "";
        return;
    }

    inputValue.value = formatDisplayDate(parsed, props.enableTime);
    emitAll(parsed);
}

/**
 * Chuyển lịch về tháng trước nếu nằm trong khoảng cho phép.
 * @returns Không trả về giá trị.
 */
function goPrevMonth(): void {
    if (!canGoPrev.value) {
        return;
    }

    const date = new Date(viewYear.value, viewMonth.value - 1, 1);
    viewMonth.value = date.getMonth();
    viewYear.value = date.getFullYear();
}

/**
 * Chuyển lịch sang tháng sau nếu nằm trong khoảng cho phép.
 * @returns Không trả về giá trị.
 */
function goNextMonth(): void {
    if (!canGoNext.value) {
        return;
    }

    const date = new Date(viewYear.value, viewMonth.value + 1, 1);
    viewMonth.value = date.getMonth();
    viewYear.value = date.getFullYear();
}

/**
 * Chuyển lịch về cùng tháng của năm trước nếu nằm trong khoảng cho phép.
 * @returns Không trả về giá trị.
 */
function goPrevYear(): void {
    if (!canGoPrevYear.value) {
        return;
    }

    const date = new Date(viewYear.value - 1, viewMonth.value, 1);
    viewMonth.value = date.getMonth();
    viewYear.value = date.getFullYear();
}

/**
 * Chuyển lịch sang cùng tháng của năm sau nếu nằm trong khoảng cho phép.
 * @returns Không trả về giá trị.
 */
function goNextYear(): void {
    if (!canGoNextYear.value) {
        return;
    }

    const date = new Date(viewYear.value + 1, viewMonth.value, 1);
    viewMonth.value = date.getMonth();
    viewYear.value = date.getFullYear();
}

/**
 * Chọn một ngày trên lịch và phát giá trị ra ngoài.
 * @param date Ngày được người dùng chọn.
 * @returns Không trả về giá trị.
 */
function selectDay(date: Date): void {
    if (isDateDisabled(date)) {
        return;
    }

    const selected = withPreservedTime(date, selectedDate.value, props.enableTime);
    inputValue.value = formatDisplayDate(selected, props.enableTime);
    emitAll(selected);
    closeCalendar();
}

/**
 * Chọn ngày hiện tại nếu không bị chặn bởi min/max.
 * @returns Không trả về giá trị.
 */
function pickToday(): void {
    const today = normalizeDate(new Date());
    if (isDateDisabled(today)) {
        return;
    }

    const now = new Date();
    const selected = props.enableTime
        ? new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate(),
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
          )
        : withPreservedTime(today, selectedDate.value, false);
    inputValue.value = formatDisplayDate(selected, props.enableTime);
    emitAll(selected);
    closeCalendar();
}

/**
 * Phát đồng thời các sự kiện cập nhật giá trị cho component cha.
 * @param value Giá trị ngày kiểu Date hoặc null khi xóa dữ liệu.
 * @returns Không trả về giá trị.
 */
function emitAll(value: Date | null): void {
    emit("update:modelValue", value);
    emit("input", value);
    emit("change", value);
}

/**
 * Đóng popup lịch khi người dùng click ra ngoài component.
 * @param event Sự kiện click chuột trên document.
 * @returns Không trả về giá trị.
 */
function onClickOutside(event: MouseEvent): void {
    if (!isOpen.value || !wrapperRef.value) {
        return;
    }

    const target = event.target as Node;
    if (!wrapperRef.value.contains(target)) {
        closeCalendar();
    }
}

/**
 * Phân tích chuỗi ngày theo định dạng yyyy-MM-dd thành đối tượng Date.
 * @param value Giá trị đầu vào cần phân tích.
 * @returns Date đã chuẩn hóa hoặc null nếu không hợp lệ.
 */
function parseDateString(value?: string | number | null): Date | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const raw = `${value}`.trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }

    return normalizeDate(date);
}

/**
 * Phân tích ngày theo nhiều định dạng hỗ trợ (yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy).
 * @param value Giá trị ngày người dùng nhập.
 * @returns Date đã chuẩn hóa hoặc null nếu không hợp lệ.
 */
function parseFlexibleDate(value: string): Date | null {
    const iso = parseDateString(value);
    if (iso) {
        return iso;
    }

    const match = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }

    return normalizeDate(date);
}

/**
 * Chuẩn hóa modelValue về Date hợp lệ theo chế độ bật/tắt thời gian.
 * @param value Giá trị modelValue kiểu Date từ component cha.
 * @param includeTime Cờ bật/tắt chế độ ngày giờ.
 * @returns Date đã chuẩn hóa hoặc null nếu modelValue không hợp lệ.
 */
function normalizeModelDateValue(value: Date | null | undefined, includeTime: boolean): Date | null {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        return null;
    }

    if (!includeTime) {
        return normalizeDate(value);
    }

    return new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate(),
        value.getHours(),
        value.getMinutes(),
        value.getSeconds(),
    );
}

/**
 * Chuẩn hóa chuỗi nhập ngày và tự động chèn dấu "/" sau phần ngày/tháng khi đủ 2 chữ số.
 * @param raw Chuỗi người dùng vừa nhập trên input.
 * @param inputType Loại thao tác input để xử lý đúng trường hợp xóa ký tự.
 * @returns Chuỗi đã được làm sạch và định dạng lại theo dd/MM/yyyy khi gõ.
 */
function sanitizeDateTypingInput(raw: string, inputType?: string, includeTime = false): string {
    const normalized = raw.replace(/[^0-9/-]/g, "").replace(/-/g, "/");
    const isDeleting = (inputType || "").startsWith("delete");
    if (isDeleting) {
        const deleteNormalized = includeTime
            ? raw.replace(/[^0-9/:\-\s]/g, "").replace(/-/g, "/")
            : raw.replace(/[^0-9/-]/g, "").replace(/-/g, "/");
        return deleteNormalized.slice(0, includeTime ? 19 : 10);
    }

    if (includeTime) {
        return sanitizeDateTimeTypingInput(normalized);
    }

    const digitsOnly = normalized.replace(/\D/g, "").slice(0, 8);
    const dayRaw = digitsOnly.slice(0, 2);
    const monthRaw = digitsOnly.slice(2, 4);
    const yearRaw = digitsOnly.slice(4, 8);

    const day = sanitizeSegment(dayRaw, 2, 31);
    const month = sanitizeSegment(monthRaw, 2, 12);
    const year = yearRaw.replace(/\D/g, "").slice(0, 4);

    if (!day) {
        return "";
    }

    const hasDaySeparator = day.length === 2;
    const hasMonthSeparator = month.length === 2;

    let result = day;
    if (hasDaySeparator) {
        result += "/";
    }

    if (!monthRaw) {
        return result;
    }

    result += month;
    if (hasMonthSeparator) {
        result += "/";
    }

    if (!year) {
        return result;
    }

    return `${result}${year}`;
}

/**
 * Chuẩn hóa chuỗi nhập ngày giờ và tự động chèn ký tự phân tách theo dd/MM/yyyy HH:mm:ss.
 * @param raw Chuỗi người dùng nhập.
 * @returns Chuỗi đã được chuẩn hóa cho chế độ nhập ngày giờ.
 */
function sanitizeDateTimeTypingInput(raw: string): string {
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 14);
    const dayRaw = digitsOnly.slice(0, 2);
    const monthRaw = digitsOnly.slice(2, 4);
    const yearRaw = digitsOnly.slice(4, 8);
    const hourRaw = digitsOnly.slice(8, 10);
    const minuteRaw = digitsOnly.slice(10, 12);
    const secondRaw = digitsOnly.slice(12, 14);

    const day = sanitizeSegment(dayRaw, 2, 31);
    const month = sanitizeSegment(monthRaw, 2, 12);
    const year = yearRaw.slice(0, 4);
    const hour = sanitizeSegment(hourRaw, 2, 23);
    const minute = sanitizeSegment(minuteRaw, 2, 59);
    const second = sanitizeSegment(secondRaw, 2, 59);

    if (!day) {
        return "";
    }

    let result = day;
    if (day.length === 2) {
        result += "/";
    }

    if (!monthRaw) {
        return result;
    }

    result += month;
    if (month.length === 2) {
        result += "/";
    }

    if (!yearRaw) {
        return result;
    }

    result += year;
    if (year.length < 4) {
        return result;
    }

    result += " ";
    if (!hourRaw) {
        return result;
    }

    result += hour;
    if (hour.length === 2) {
        result += ":";
    }

    if (!minuteRaw) {
        return result;
    }

    result += minute;
    if (minute.length === 2) {
        result += ":";
    }

    if (!secondRaw) {
        return result;
    }

    return `${result}${second}`;
}

/**
 * Phân tích chuỗi ngày và tự động bổ sung tháng/năm hiện tại khi người dùng nhập thiếu.
 * @param value Giá trị ngày người dùng nhập trong input.
 * @returns Date đã chuẩn hóa hoặc null nếu giá trị không hợp lệ.
 */
function parseDateWithAutoComplete(value: string, includeTime = false): Date | null {
    const fullDate = includeTime ? parseFlexibleDateTime(value) : parseFlexibleDate(value);
    if (fullDate) {
        return fullDate;
    }

    const trimmed = value.trim();
    const datePart = trimmed ? trimmed.split(/\s+/)[0] : "";
    const parsedDatePart = parseFlexibleDate(datePart);
    if (parsedDatePart) {
        const parsedTime = includeTime ? parseTimeWithAutoComplete(value) : { hour: 0, minute: 0, second: 0 };
        if (!parsedTime) {
            return null;
        }

        return new Date(
            parsedDatePart.getFullYear(),
            parsedDatePart.getMonth(),
            parsedDatePart.getDate(),
            parsedTime.hour,
            parsedTime.minute,
            parsedTime.second,
        );
    }

    const normalizedDate = datePart.replace(/-/g, "/").replace(/[^0-9/]/g, "");
    const segments = normalizedDate.split("/").filter((segment) => segment !== "");
    if (segments.length === 0 || segments.length > 2) {
        return null;
    }

    const day = Number(segments[0]);
    if (Number.isNaN(day)) {
        return null;
    }

    const today = new Date();
    const month = segments.length >= 2 ? Number(segments[1]) : today.getMonth() + 1;
    const year = today.getFullYear();

    if (Number.isNaN(month)) {
        return null;
    }

    const time = includeTime ? parseTimeWithAutoComplete(value) : { hour: 0, minute: 0, second: 0 };
    if (!time) {
        return null;
    }

    const parsed = new Date(year, month - 1, day, time.hour, time.minute, time.second);
    if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day ||
        parsed.getHours() !== time.hour ||
        parsed.getMinutes() !== time.minute ||
        parsed.getSeconds() !== time.second
    ) {
        return null;
    }

    return includeTime ? parsed : normalizeDate(parsed);
}

/**
 * Phân tích chuỗi theo định dạng dd/MM/yyyy HH:mm:ss.
 * @param value Giá trị ngày giờ cần phân tích.
 * @returns Date hợp lệ hoặc null nếu định dạng sai.
 */
function parseFlexibleDateTime(value: string): Date | null {
    const dateTimePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
    const match = value.match(dateTimePattern);
    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const hour = Number(match[4]);
    const minute = Number(match[5]);
    const second = Number(match[6] || "0");
    const date = new Date(year, month, day, hour, minute, second);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute ||
        date.getSeconds() !== second
    ) {
        return null;
    }

    return date;
}

/**
 * Tách phần thời gian từ chuỗi nhập và tự hoàn thiện các phần còn thiếu.
 * @param value Chuỗi input đầy đủ ngày giờ hoặc đang nhập dở.
 * @returns Đối tượng giờ/phút/giây hợp lệ hoặc null nếu sai.
 */
function parseTimeWithAutoComplete(value: string): { hour: number; minute: number; second: number } | null {
    const trimmed = value.trim();
    const timePart = trimmed.includes(" ") ? trimmed.split(/\s+/).slice(1).join(" ") : "";
    if (!timePart) {
        return { hour: 0, minute: 0, second: 0 };
    }

    const normalizedTime = timePart.replace(/[^0-9:]/g, "");
    const segments = normalizedTime.split(":");
    if (segments.length > 3) {
        return null;
    }

    const hour = parseTimeSegment(segments[0], 23, 0);
    const minute = parseTimeSegment(segments[1], 59, 0);
    const second = parseTimeSegment(segments[2], 59, 0);

    if (hour === null || minute === null || second === null) {
        return null;
    }

    return { hour, minute, second };
}

/**
 * Phân tích một segment thời gian với giá trị mặc định khi thiếu.
 * @param value Segment thời gian cần phân tích.
 * @param maxValue Giá trị tối đa cho segment.
 * @param fallback Giá trị mặc định khi segment rỗng.
 * @returns Giá trị số hợp lệ hoặc null nếu vượt ngưỡng.
 */
function parseTimeSegment(value: string | undefined, maxValue: number, fallback: number): number | null {
    if (value === undefined || value === "") {
        return fallback;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > maxValue) {
        return null;
    }

    return numeric;
}

/**
 * Làm sạch và giới hạn một segment số của ngày/tháng theo độ dài và giá trị tối đa.
 * @param value Chuỗi segment cần làm sạch.
 * @param maxLength Độ dài tối đa của segment.
 * @param maxValue Giá trị số lớn nhất cho phép của segment.
 * @returns Segment số hợp lệ sau khi chuẩn hóa.
 */
function sanitizeSegment(value: string, maxLength: number, maxValue: number): string {
    const digits = value.replace(/\D/g, "").slice(0, maxLength);
    if (!digits) {
        return "";
    }

    if (maxLength === 2) {
        const firstDigit = Number(digits[0]);
        const firstDigitMax = Math.floor(maxValue / 10);
        if (Number.isNaN(firstDigit) || firstDigit > firstDigitMax) {
            return "";
        }
    }

    if (digits.length < maxLength) {
        return digits;
    }

    if (maxLength === 2) {
        const firstDigit = Number(digits[0]);
        const secondDigit = Number(digits[1]);
        const firstDigitMax = Math.floor(maxValue / 10);
        const secondDigitMax = maxValue % 10;

        if (Number.isNaN(firstDigit) || Number.isNaN(secondDigit)) {
            return "";
        }

        if (firstDigit > firstDigitMax) {
            return "";
        }

        if (firstDigit === firstDigitMax && secondDigit > secondDigitMax) {
            return digits.slice(0, 1);
        }
    }

    return digits;
}

/**
 * Chuẩn hóa Date về mốc 00:00:00 để so sánh theo ngày.
 * @param date Ngày cần chuẩn hóa.
 * @returns Date mới đã được chuẩn hóa.
 */
function normalizeDate(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Định dạng Date sang chuỗi chuẩn yyyy-MM-dd để lưu model.
 * @param date Ngày cần định dạng.
 * @returns Chuỗi ngày theo định dạng yyyy-MM-dd.
 */
function formatDateValue(date: Date, includeTime = false): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    if (!includeTime) {
        return `${year}-${month}-${day}`;
    }

    const hour = `${date.getHours()}`.padStart(2, "0");
    const minute = `${date.getMinutes()}`.padStart(2, "0");
    const second = `${date.getSeconds()}`.padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Định dạng Date sang chuỗi hiển thị dd/MM/yyyy cho input.
 * @param date Ngày cần định dạng.
 * @returns Chuỗi ngày theo định dạng dd/MM/yyyy.
 */
function formatDisplayDate(date: Date, includeTime = false): string {
    const day = `${date.getDate()}`.padStart(2, "0");
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const year = date.getFullYear();
    if (!includeTime) {
        return `${day}/${month}/${year}`;
    }

    const hour = `${date.getHours()}`.padStart(2, "0");
    const minute = `${date.getMinutes()}`.padStart(2, "0");
    const second = `${date.getSeconds()}`.padStart(2, "0");
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
}

/**
 * Ghép phần ngày mới với phần thời gian cũ để giữ giờ khi chọn lại ngày trên lịch.
 * @param dateOnly Ngày mới được chọn từ lịch.
 * @param sourceDate Giá trị đang có để lấy giờ/phút/giây.
 * @param includeTime Cờ bật/tắt chế độ ngày giờ.
 * @returns Date cuối cùng sẽ được lưu.
 */
function withPreservedTime(dateOnly: Date, sourceDate: Date | null, includeTime: boolean): Date {
    if (!includeTime) {
        return dateOnly;
    }

    if (!sourceDate) {
        return new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), 0, 0, 0);
    }

    return new Date(
        dateOnly.getFullYear(),
        dateOnly.getMonth(),
        dateOnly.getDate(),
        sourceDate.getHours(),
        sourceDate.getMinutes(),
        sourceDate.getSeconds(),
    );
}

/**
 * So sánh hai Date theo cùng ngày/tháng/năm.
 * @param a Ngày thứ nhất.
 * @param b Ngày thứ hai.
 * @returns true nếu cùng một ngày, ngược lại false.
 */
function isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Kiểm tra một ngày có bị chặn bởi giới hạn min/max hay không.
 * @param date Ngày cần kiểm tra.
 * @returns true nếu ngày nằm ngoài khoảng cho phép.
 */
function isDateDisabled(date: Date): boolean {
    if (minDate.value && date < minDate.value) {
        return true;
    }

    if (maxDate.value && date > maxDate.value) {
        return true;
    }

    return false;
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.base-datepicker-wrapper {
    width: 100%;
}

.base-datepicker-label {
    display: block;
    margin-bottom: 10px;
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    color: $color-text-black;
    line-height: 1;
}

.base-datepicker-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.base-datepicker {
    flex: 1;
    width: 100%;
    padding: 0 34px 0 12px;
    border: $input-border;
    border-radius: $control-border-radius;
    background-color: #ffffff;
    color: $color-text-black;
    font-family: $font-family-base;
    font-size: $input-font-size;
    line-height: 1;
    text-align: left;
    outline: none;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease;

    &:hover:not(.is-disabled):not(.is-readonly),
    &.is-open:not(.is-disabled):not(.is-readonly),
    &:focus-visible:not(.is-disabled):not(.is-readonly) {
        border-color: $primary-color;
    }

    &::placeholder {
        color: #9ca3af;
    }

    &.is-disabled {
        border-color: #e7e8e9;
        background-color: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
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
    z-index: 2;
}

.default-calendar-icon {
    border: none;
    background: transparent;
    cursor: pointer;

    &:disabled {
        cursor: not-allowed;
    }

    .icon-calendar {
        cursor: inherit;
    }
}

.calendar-popup {
    position: absolute;
    z-index: 30;
    top: calc(100% + 6px);
    left: 0;
    width: 280px;
    padding: 10px;
    border: 1px solid #e6e8f0;
    border-radius: $control-border-radius;
    background: #ffffff;
    box-shadow: 0 10px 28px rgba(17, 24, 39, 0.16);
}

.calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.nav-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.calendar-title {
    font-family: $font-family-base;
    font-size: $font-size-base;
    font-weight: $font-weight-button;
    color: $color-text-black;
}

.nav-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: $primary-color;
        color: $primary-color;
    }

    &:disabled {
        cursor: not-allowed;
    }

    span[class^="icon-nav-"] {
        cursor: inherit;
    }
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    margin-bottom: 6px;

    span {
        text-align: center;
        font-size: 11px;
        font-weight: 600;
        color: #8b93a7;
        line-height: 26px;
    }
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

.day-cell {
    height: 32px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: $color-text-black;
    font-size: 12px;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: $hover-color;
        color: $primary-color;
    }

    &.is-other-month {
        color: #c0c5d1;
    }

    &.is-today {
        box-shadow: inset 0 0 0 1px $primary-color;
    }

    &.is-selected {
        background: $primary-color;
        color: #ffffff;
        font-weight: 600;
    }

    &.is-disabled {
        color: #d1d5db;
        cursor: not-allowed;
    }
}

.calendar-footer {
    display: flex;
    justify-content: center;
    margin-top: 10px;
    padding-top: 8px;
    height: 36px;
    border-top: 1px solid #eef0f5;
}

.footer-btn {
    border: none;
    background: transparent;
    color: $primary-color;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        color: #c4c9d6;
        cursor: not-allowed;
    }
}
</style>
