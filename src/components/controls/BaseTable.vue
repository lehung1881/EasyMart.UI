<template>
    <div class="tb-root" :class="{ 'tb-root--disabled': disabled }">
        <div class="tb-root__wrapper overflow-auto">
            <table class="tb-root__table">
                <BaseTableHeader
                    :columns="tableColumns"
                    :show-selection="showSelection"
                    :show-row-action="showRowAction"
                    :all-selected="allCurrentPageSelected"
                    @toggle-all="onToggleAllCurrentPage"
                >
                    <template v-for="(_, name) in $slots" #[name]="slotData">
                        <slot :name="name" v-bind="slotData ?? {}" />
                    </template>
                </BaseTableHeader>

                <BaseTableContent
                    :data="tableData"
                    :columns="tableColumns"
                    :selected-rows="store.selectedRows"
                    :row-key="store.keyID"
                    :loading="store.loading"
                    :empty-text="emptyText"
                    :show-selection="showSelection"
                    :show-row-action="showRowAction"
                    :list-row-action="listRowAction"
                    @row-click="onRowClick"
                    @toggle-row="onToggleRow"
                    @row-action-click="onRowAction"
                >
                    <template v-for="(_, name) in $slots" #[name]="slotData">
                        <slot :name="name" v-bind="slotData ?? {}" />
                    </template>
                </BaseTableContent>
            </table>
        </div>
        <div v-if="showPagination" class="tb-pagination">
            <div class="tb-pagination__label">
                Tổng số: <span>{{ store.totalRecords }}</span>
            </div>
            <div class="tb-pagination__controls">
                <div class="tb-pagination__left">
                    <span class="tb-pagination__label">Số dòng/trang</span>
                    <div class="tb-pagination__page-size-combobox">
                        <BaseCombobox
                            v-model="selectedPageSize"
                            :store="pageSizeStore"
                            :searchable="false"
                            :auto-load="true"
                            size="sm"
                        />
                    </div>
                    <span class="tb-pagination__range">{{ rowRangeText }}</span>
                </div>
                <div class="tb-pagination__nav">
                    <button class="tb-pagination__btn" type="button" :disabled="!store.canGoPrev" @click="onGoFirst">
                        <div class="icon-page-first"></div>
                    </button>
                    <button class="tb-pagination__btn" type="button" :disabled="!store.canGoPrev" @click="onGoPrev">
                        <div class="icon-page-prev"></div>
                    </button>
                    <button class="tb-pagination__btn" type="button" :disabled="!store.canGoNext" @click="onGoNext">
                        <div class="icon-page-next"></div>
                    </button>
                    <button class="tb-pagination__btn" type="button" :disabled="!store.canGoNext" @click="onGoLast">
                        <div class="icon-page-last"></div>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BaseCombobox from "@/components/controls/BaseCombobox.vue";
import BaseTableHeader from "@/components/controls/BaseTableHeader.vue";
import BaseTableContent from "@/components/controls/BaseTableContent.vue";
import { useComboboxStore } from "@/composables/controls/useComboboxStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import type { TableRow, TableStoreInstance } from "@/composables/controls/useTableStore";

interface PageSizeOption {
    label: string;
    value: number;
}

interface TableRowAction {
    actionName: string;
    icon: string;
    show: (row: TableRow) => boolean;
}

const props = withDefaults(
    defineProps<{
        store: TableStoreInstance;
        columns?: ColumnDefinition[];
        autoLoad?: boolean;
        disabled?: boolean;
        emptyText?: string;
        showPagination?: boolean;
        showSelection?: boolean;
        showRowAction?: boolean;
        listRowAction?: TableRowAction[];
        pageSizeOptions?: number[];
    }>(),
    {
        columns: undefined,
        autoLoad: true,
        disabled: false,
        emptyText: "Khong co du lieu",
        showPagination: true,
        showSelection: true,
        showRowAction: true,
        listRowAction: () => [],
        pageSizeOptions: () => [10, 20, 30, 50, 100],
    },
);

const emit = defineEmits<{
    (e: "row-click", payload: { row: TableRow; index: number }): void;
    (e: "page-change", page: number): void;
    (e: "page-size-change", pageSize: number): void;
    (e: "row-action-click", action: TableRowAction, row: TableRow): void;
}>();

const selectedPageSize = ref<number>(props.store.pageSize);

/**
 * Lấy danh sách cột hiển thị.
 * @returns Danh sách cột cho table.
 */
const tableColumns = computed<ColumnDefinition[]>(() => props.columns ?? props.store.columns ?? []);

/**
 * Lấy dữ liệu trang hiện tại từ store.
 * @returns Danh sách row hiển thị.
 */
const tableData = computed<TableRow[]>(() => props.store.data ?? []);

/**
 * Kiểm tra tất cả row ở trang hiện tại đã được chọn hay chưa.
 * @returns True nếu tất cả row trang hiện tại đang selected.
 */
const allCurrentPageSelected = computed<boolean>(() => {
    if (!props.showSelection) return false;
    if (tableData.value.length === 0) return false;
    return tableData.value.every((row) => props.store.isRowSelected(row, props.store.keyID));
});

/**
 * Tạo text khoảng dòng hiển thị.
 * @returns Chuỗi start-end.
 */
const rowRangeText = computed<string>(() => {
    if (props.store.totalRecords === 0) return "0 - 0";
    return `${props.store.startRow} - ${props.store.endRow}`;
});

/**
 * Chuyển pageSizeOptions thành dữ liệu local cho combobox.
 * @returns Dữ liệu combobox page size.
 */
const pageSizeData = computed<PageSizeOption[]>(() =>
    props.pageSizeOptions.map((size) => ({
        label: String(size),
        value: size,
    })),
);

/**
 * Lấy page size mặc định ưu tiên 20, fallback option đầu tiên.
 * @returns Page size mặc định hợp lệ.
 */
const defaultPageSize = computed<number>(() => {
    if (props.pageSizeOptions.includes(20)) return 20;
    return props.pageSizeOptions[0] ?? 20;
});

const pageSizeStore = useComboboxStore("page_size", {
    queryMode: "local",
    data: pageSizeData.value,
    comboboxLoadData: async () => [],
    displayField: "label",
    valueField: "value",
});

/**
 * Emit sự kiện click dòng ra ngoài.
 * @param payload Payload dòng được chọn.
 * @returns Không trả về giá trị.
 */
const onRowClick = (payload: { row: TableRow; index: number }): void => {
    emit("row-click", payload);
};

/**
 * Đồng bộ trạng thái checkbox vào selectedRows của store.
 * @param payload Dữ liệu row và trạng thái checked.
 * @returns Không trả về giá trị.
 */
const onToggleRow = (payload: { row: TableRow; checked: boolean }): void => {
    props.store.toggleRowSelection(payload.row, payload.checked, props.store.keyID);
};

/**
 * Emit sự kiện row action ra ngoài component cha.
 * @param action Action được click trên dòng.
 * @param row Dữ liệu dòng tương ứng với action.
 * @returns Không trả về giá trị.
 */
const onRowAction = (action: TableRowAction, row: TableRow): void => {
    emit("row-action-click", action, row);
};

/**
 * Check/uncheck toàn bộ row trên trang hiện tại.
 * @param checked Trạng thái checkbox header.
 * @returns Không trả về giá trị.
 */
const onToggleAllCurrentPage = (checked: boolean): void => {
    tableData.value.forEach((row) => {
        props.store.toggleRowSelection(row, checked, props.store.keyID);
    });
};

/**
 * Điều hướng về trang đầu.
 * @returns Promise hoàn tất điều hướng.
 */
const onGoFirst = async (): Promise<void> => {
    if (props.disabled) return;
    await props.store.goToFirstPage();
    emit("page-change", props.store.currentPage);
};

/**
 * Điều hướng về trang trước.
 * @returns Promise hoàn tất điều hướng.
 */
const onGoPrev = async (): Promise<void> => {
    if (props.disabled) return;
    await props.store.goToPrevPage();
    emit("page-change", props.store.currentPage);
};

/**
 * Điều hướng sang trang kế tiếp.
 * @returns Promise hoàn tất điều hướng.
 */
const onGoNext = async (): Promise<void> => {
    if (props.disabled) return;
    await props.store.goToNextPage();
    emit("page-change", props.store.currentPage);
};

/**
 * Điều hướng về trang cuối.
 * @returns Promise hoàn tất điều hướng.
 */
const onGoLast = async (): Promise<void> => {
    if (props.disabled) return;
    await props.store.goToLastPage();
    emit("page-change", props.store.currentPage);
};

/**
 * Đồng bộ cột từ props vào store.
 * @param nextColumns Cột mới.
 * @returns Không trả về giá trị.
 */
watch(
    () => props.columns,
    (nextColumns) => {
        if (!nextColumns) return;
        props.store.columns = [...nextColumns];
    },
    { immediate: true },
);

/**
 * Đồng bộ options page size vào combobox store.
 * @param nextData Dữ liệu options mới.
 * @returns Không trả về giá trị.
 */
watch(
    pageSizeData,
    (nextData) => {
        pageSizeStore.initConfigStore({
            queryMode: "local",
            data: nextData,
            comboboxLoadData: async () => [],
            displayField: "label",
            valueField: "value",
        });
        pageSizeStore.loadData("");
    },
    { immediate: true },
);

/**
 * Đồng bộ giá trị page size hiển thị theo table store.
 * @param nextPageSize Page size mới từ store.
 * @returns Không trả về giá trị.
 */
watch(
    () => props.store.pageSize,
    (nextPageSize) => {
        if (props.pageSizeOptions.includes(nextPageSize)) {
            selectedPageSize.value = nextPageSize;
            return;
        }
        selectedPageSize.value = defaultPageSize.value;
    },
    { immediate: true },
);

/**
 * Áp dụng page size mới khi user chọn từ combobox.
 * @param nextPageSize Page size mới.
 * @param prevPageSize Page size trước đó.
 * @returns Promise hoàn tất reload.
 */
watch(selectedPageSize, async (nextPageSize, prevPageSize) => {
    if (nextPageSize === prevPageSize) return;
    if (props.disabled) return;
    await props.store.setPageSize(nextPageSize);
    emit("page-size-change", props.store.pageSize);
    emit("page-change", props.store.currentPage);
});

/**
 * Load dữ liệu ban đầu khi mount.
 * @returns Promise hoàn tất load.
 */
onMounted(async () => {
    if (!props.autoLoad || props.disabled) return;
    if (!props.pageSizeOptions.includes(props.store.pageSize)) {
        await props.store.setPageSize(defaultPageSize.value);
        return;
    }
    await props.store.loadData();
});

/**
 * Hủy child stores khi component unmount.
 * @returns Không trả về giá trị.
 */
onBeforeUnmount(() => {
    props.store.$dispose();
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

.tb-root {
    width: 100%;

    &--disabled {
        opacity: 0.55;
        pointer-events: none;
    }
    height: 100%;
}

.tb-root__wrapper {
    width: 100%;
    border: $input-border;
    border-radius: $border-radius;
    background: #fff;
    // overflow: hidden;
    height: calc(100% - 48px);
}

.tb-root__table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.tb-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 12px;
    background: #fff;
    height: 48px;
}

.tb-pagination__controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.tb-pagination__left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.tb-pagination__label,
.tb-pagination__range {
    font-size: $font-size-base;
    color: #374151;
    font-weight: 600;
}

.tb-pagination__page-size-combobox {
    width: 80px;
}

.tb-pagination__nav {
    display: flex;
    align-items: center;
    gap: 4px;
}

.tb-pagination__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: #374151;
    border-radius: 4px;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: $hover-color;
        color: $primary-color;
    }

    &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }
}

.tb-pagination__btn :deep(div) {
    pointer-events: none;
}
</style>
