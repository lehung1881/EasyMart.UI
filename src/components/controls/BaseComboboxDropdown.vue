<template>
    <div class="cb-dropdown">
        <!-- Loading state -->
        <div v-if="loading" class="cb-dropdown__loading">
            <span class="cb-dropdown__spinner" aria-hidden="true"></span>
            <span>Đang tải...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="!data || data.length === 0" class="cb-dropdown__empty">Không có kết quả</div>

        <!-- TABLE MODE — khi có columns prop -->
        <template v-else-if="columns && columns.length > 0">
            <table class="cb-dropdown__table" role="listbox">
                <thead class="cb-dropdown__thead">
                    <tr class="cb-dropdown__tr">
                        <th
                            v-for="col in columns"
                            :key="col.dataField"
                            :style="columnStyle(col)"
                            class="cb-dropdown__th"
                        >
                            <div class="header-title">
                                {{ col.title }}
                            </div>
                        </th>
                        <th :style="'width: 30px;'" class="cb-dropdown__th"></th>
                    </tr>
                </thead>
                <tbody class="cb-dropdown__tbody" :style="{ maxHeight: maxTableBodyHeight }">
                    <tr
                        v-for="(item, index) in data"
                        :key="item[valueField]"
                        :ref="
                            (el) => {
                                if (el) itemRefs[index] = el as HTMLElement;
                            }
                        "
                        role="option"
                        :aria-selected="isSelected(item)"
                        class="cb-dropdown__row"
                        :class="{
                            'cb-dropdown__row--active': activeIndex === index,
                            'cb-dropdown__row--selected': isSelected(item),
                        }"
                        @mousedown.prevent="emit('select', item)"
                    >
                        <!-- Slot: custom toàn bộ <tr> -->
                        <slot name="row" :item="item" :index="index" :columns="columns">
                            <td
                                v-for="col in columns"
                                :key="col.dataField"
                                class="cb-dropdown__td"
                                :style="columnStyle(col)"
                            >
                                <!-- Slot: custom từng cell theo field -->
                                <slot :name="`cell-${col.dataField}`" :item="item" :value="item[col.dataField]">
                                    {{ displayData(item[col.dataField], col) }}
                                </slot>
                            </td>
                            <td
                                class="cb-dropdown__td"
                                :style="{ width: data.length > maxDisplayItem ? '24px' : '30px' }"
                            ></td>
                        </slot>
                    </tr>
                    <!-- Sentinel row -->
                    <tr v-if="hasMore" ref="sentinelRef" class="cb-sentinel" aria-hidden="true">
                        <td :colspan="columns?.length ?? 1" />
                    </tr>
                    <tr v-if="loadingMore" class="cb-dropdown__loading-more-row" aria-hidden="true">
                        <td :colspan="columns?.length ?? 1" class="cb-dropdown__loading-more-cell">
                            <span class="cb-dropdown__spinner" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </template>

        <!-- LIST MODE — khi không có columns -->
        <ul v-else class="cb-dropdown__list" role="listbox" :style="{ maxHeight: maxListHeight }">
            <li
                v-for="(item, index) in data"
                :key="item[valueField]"
                :ref="
                    (el) => {
                        if (el) itemRefs[index] = el as HTMLElement;
                    }
                "
                role="option"
                :aria-selected="isSelected(item)"
                class="cb-dropdown__item"
                :class="{
                    'cb-dropdown__item--active': activeIndex === index,
                    'cb-dropdown__item--selected': isSelected(item),
                }"
                @mousedown.prevent="emit('select', item)"
            >
                <!-- Slot: custom render item -->
                <slot name="item" :item="item" :index="index">
                    {{ item[displayField] }}
                </slot>
            </li>

            <!-- Sentinel — IntersectionObserver bắt khi cuộn chạm đáy -->
            <li v-if="hasMore" ref="sentinelRef" class="cb-sentinel" aria-hidden="true" />
            <!-- Loading more indicator -->
            <li v-if="loadingMore" class="cb-dropdown__loading-more" aria-hidden="true">
                <span class="cb-dropdown__spinner" />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
/**
 * BaseComboboxDropdown.vue
 * UI layer — Pure render component, không chứa business logic.
 * Chỉ nhận props và render dropdown list hoặc table.
 */

import { ref, computed, watch, onBeforeUnmount } from "vue";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import { formatData } from "@/commons/formatData";
// ─── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(
    defineProps<{
        /** Dữ liệu hiển thị trong dropdown */
        data: Array<any>;
        /** Field dùng để hiển thị text */
        displayField: string;
        /** Field dùng làm value */
        valueField: string;
        /** Nếu có → render dạng bảng; không có → render dạng list */
        columns?: ColumnDefinition[];
        /** Index item đang được highlight (keyboard nav) */
        activeIndex: number;
        /** Giá trị đang được chọn (để highlight selected) */
        selectedValue: any;
        /** Đang tải dữ liệu (lần đầu) */
        loading: boolean;
        /** Đang tải thêm trang kế (infinite scroll) */
        loadingMore?: boolean;
        /** Còn dữ liệu để load thêm không */
        hasMore?: boolean;
        /** Số item tối đa hiển thị trước khi scroll, default: 6 */
        maxDisplayItem?: number;
    }>(),
    {
        // Bắt buộc có default để tránh lỗi khi store chưa init xong
        data: () => [],
        columns: undefined,
        loadingMore: false,
        hasMore: false,
        maxDisplayItem: 6,
    },
);

// ─── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
    /** Khi click chọn item */
    (e: "select", item: any): void;
    /** Khi hover vào item — cập nhật activeIndex ở parent */
    (e: "hover", index: number): void;
    /** Khi scroll chạm đáy — yêu cầu load trang kế */
    (e: "load-more"): void;
}>();

// ─── Refs ─────────────────────────────────────────────────────────────────────

/** Mảng ref tới từng item element để scroll into view */
const itemRefs = ref<HTMLElement[]>([]);
/** Sentinel element ở cuối list — IntersectionObserver theo dõi để trigger load-more */
const sentinelRef = ref<HTMLElement | null>(null);
/** Observer instance */
let observer: IntersectionObserver | null = null;

// ─── Computed ─────────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 36; // px — khớp với $item-height trong SCSS
const LIST_PADDING = 8; // 4px top + 4px bottom của ul

/**
 * maxListHeight — Chiều cao tối đa của scroll container.
 * List mode : itemHeight * n + padding ul
 * Table mode: itemHeight * n + thead (~33px)
 */
const maxListHeight = computed(() => `${ITEM_HEIGHT * props.maxDisplayItem + LIST_PADDING}px`);
const maxTableBodyHeight = computed(() => `${ITEM_HEIGHT * props.maxDisplayItem}px`);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const displayData = (value: any, col: ColumnDefinition): string => {
    return formatData.formatDisplayData(value, col.formatType ?? 0);
};

/**
 * isSelected — Kiểm tra item có đang được chọn không.
 * So sánh theo valueField để tránh reference equality issue.
 */
const isSelected = (item: any): boolean => {
    if (props.selectedValue == null) return false;
    if (typeof props.selectedValue === "object") {
        return props.selectedValue[props.valueField] === item[props.valueField];
    }
    return props.selectedValue === item[props.valueField];
};

/**
 * columnStyle — Trả về object style cho <th> và <td>.
 * Tập trung tất cả style liên quan đến column vào một chỗ,
 * dễ mở rộng thêm property sau này mà không cần sửa template.
 */
const columnStyle = (col: ColumnDefinition): Record<string, string> => {
    const { width, align } = col;
    const colWidth = width === undefined || width === null ? "auto" : typeof width === "number" ? `${width}px` : width;
    return {
        width: colWidth,
        maxWidth: colWidth,
        minWidth: colWidth,
        textAlign: align ?? "left",
    };
};

// ─── Watch ────────────────────────────────────────────────────────────────────

/**
 * Watch activeIndex → tự động cuộn item active vào viewport.
 */
watch(
    () => props.activeIndex,
    (index) => {
        if (index < 0) return;
        itemRefs.value[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    },
);

/**
 * Watch sentinelRef — setup IntersectionObserver khi sentinel xuất hiện trong DOM.
 * hasMore = false → sentinel bị v-if remove → observer tự disconnect.
 *
 * PHẢI dùng flush: 'post' — Vue docs yêu cầu khi watch template ref,
 * đảm bảo DOM đã patch xong trước khi callback chạy.
 * Nếu dùng flush: 'pre' (default): el.closest() trả null vì phần tử chưa mount
 * → root: null → observer theo dõi viewport thay vì scroll container → không fire.
 */
watch(
    sentinelRef,
    (el) => {
        observer?.disconnect();
        observer = null;
        if (!el) return;

        // Root là scroll container cha gần nhất (list hoặc tbody)
        const scrollParent = el.closest(".cb-dropdown__list, .cb-dropdown__tbody") as HTMLElement | null;

        observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) emit("load-more");
            },
            { root: scrollParent, threshold: 0 }, // threshold: 0 — 1px đủ để trigger
        );
        observer.observe(el);
    },
    { flush: "post" },
);

onBeforeUnmount(() => {
    observer?.disconnect();
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

$border-color: #d0d0d0;
$item-height: 36px;

.cb-dropdown {
    width: 100%;
    overflow: hidden;
    border-radius: $border-radius;
    font-size: $font-size-base;
}

.cb-dropdown__loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    color: inherit;
    opacity: 0.6;
}

.cb-dropdown__spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid $border-color;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: cb-spin 0.7s linear infinite;
    flex-shrink: 0;
}

@keyframes cb-spin {
    to {
        transform: rotate(360deg);
    }
}

.cb-dropdown__empty {
    padding: 12px 16px;
    color: inherit;
    opacity: 0.45;
    text-align: center;
    font-style: italic;
}

.cb-dropdown__list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    overflow-y: auto;
}

.cb-dropdown__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    min-height: $item-height;
    cursor: pointer;
    transition:
        background 0.12s ease,
        border-left-color 0.12s ease;
    &--active,
    &:hover {
        background: $hover-color;
    }

    // Selected
    &--selected {
        background: $hover-color;
        color: $primary-color;
        font-weight: 600;
    }

    // Active + Selected — giữ màu selected, không override
    &--active#{&}--selected {
        background: $hover-color;
    }
}

// ─── TABLE MODE ────────────────────────────────────────────────────────────────

.cb-dropdown__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.cb-dropdown__thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #f8f8f8;
}

.cb-dropdown__th {
    padding: 6px 0;
    text-align: left;
    font-weight: 600;
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: $input-border;
    .header-title {
        max-width: 100%;
        padding: 0 12px;
        border-right: 1px solid #d1d5db;
        height: 20px;
    }
    height: 36px;
}

.cb-dropdown__tbody {
    display: block;
    overflow-y: auto;
    // max-height được bind động qua :style từ prop maxDisplayItem
}

.cb-dropdown__thead tr,
.cb-dropdown__tbody tr {
    display: table;
    width: 100%;
    table-layout: fixed;
}

.cb-dropdown__row {
    cursor: pointer;
    transition:
        background 0.12s ease,
        border-left-color 0.12s ease;

    &:last-child .cb-dropdown__td {
        border-bottom: none;
    }

    // Hover / active
    &--active,
    &:hover {
        background: $hover-color;
    }

    // Selected
    &--selected {
        background: $hover-color;
        color: $primary-color;
        font-weight: 600;
    }
}

.cb-dropdown__td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba($border-color, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: inherit;
    vertical-align: middle;
}

.cb-sentinel {
    height: 1px;
    list-style: none;
}

.cb-dropdown__loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    list-style: none;
}

.cb-dropdown__loading-more-row .cb-dropdown__loading-more-cell {
    padding: 6px 0;
    text-align: center;
}
</style>
