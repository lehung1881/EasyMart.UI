<template>
    <div class="inventory-item-list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">Danh sách hàng hóa</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="onCreateItem">Thêm hàng hóa</BaseButton>
            </div>
        </div>
        <div class="page-content">
            <div class="flex justify-between search-bar">
                <div class="flex gap-2">
                    <BaseButton size="sm" variant="normal" @click="onClearSearch">Lọc</BaseButton>
                </div>
                <div class="flex gap-2">
                    <BaseInput v-model="searchKeyword" size="sm" placeholder="Tìm kiếm" @change="onSearch" />
                    <BaseButton size="sm" @click="onRefresh" icon-left="icon-refresh"></BaseButton>
                </div>
            </div>

            <div class="table-container">
                <BaseTable
                    :store="tableStore"
                    :columns="tableColumns"
                    :auto-load="false"
                    :show-selection="true"
                    row-key="InventoryItemID"
                    empty-text="Không có dữ liệu hàng hóa"
                    @row-click="onRowClick"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseTable from "@/components/base/BaseTable.vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { loadDataRemoteTable, useTableStore, type TableRow } from "@/composables/controls/useTableStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemApi";

const searchKeyword = ref<string>("");

const tableColumns: ColumnDefinition[] = [
    { dataField: "InventoryItemCode", title: "Mã hàng", width: 140, align: "left", visible: true },
    { dataField: "InventoryItemName", title: "Tên hàng hóa", width: 260, align: "left", visible: true },
    { dataField: "InventoryItemCategoryNameList", title: "Nhóm hàng", width: 180, align: "left", visible: true },
    { dataField: "UnitName", title: "Đơn vị tính", width: 120, align: "left", visible: true },
    { dataField: "BuyPrice", title: "Giá vốn", width: 140, align: "right", visible: true },
    { dataField: "SellPrice", title: "Giá bán", width: 140, align: "right", visible: true },
    { dataField: "QuantityBalance", title: "Tồn kho", width: 110, align: "right", visible: true },
    { dataField: "Inactive", title: "Trạng thái", width: 160, align: "center", visible: true },
];

/**
 * Validate nghiệp vụ trước khi xóa hàng hóa.
 * @param payload Dữ liệu validate trước khi xóa.
 * @returns `true` nếu user đồng ý xóa, ngược lại `false`.
 */
const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) return false;

    const message = payload.isDeleteSelected
        ? `Bạn có chắc chắn muốn xóa ${payload.ids.length} hàng hóa đã chọn?`
        : "Bạn có chắc chắn muốn xóa hàng hóa này?";

    return window.confirm(message);
};

const tableStore = useTableStore("inventory_item", {
    queryMode: "remote",
    tableLoadData: (payload) => loadDataRemoteTable(inventoryItemApi, payload),
    viewOrTableName: "di_inventory_item",
    columns: tableColumns,
});

const baseList = useBaseList({
    tableStore,
    api: inventoryItemApi,
    rowKey: "InventoryItemID",
    validateBeforeDelete,
});

/**
 * Thực hiện tìm kiếm danh sách theo từ khóa hiện tại.
 * @returns Promise hoàn tất tìm kiếm.
 */
const onSearch = async (): Promise<void> => {
    await baseList.search(searchKeyword.value.trim());
};

/**
 * Xóa bỏ điều kiện tìm kiếm và tải lại trang đầu.
 * @returns Promise hoàn tất clear search.
 */
const onClearSearch = async (): Promise<void> => {
    searchKeyword.value = "";
    await baseList.clearSearch();
};

/**
 * Tải lại dữ liệu trang hiện tại.
 * @returns Promise hoàn tất refresh.
 */
const onRefresh = async (): Promise<void> => {
    await baseList.refresh();
};

/**
 * Xử lý sự kiện click vào một dòng dữ liệu.
 * @param payload Dữ liệu dòng được click.
 * @returns Không trả về giá trị.
 */
const onRowClick = (payload: { row: TableRow }): void => {
    tableStore.toggleRowSelection(
        payload.row,
        !tableStore.isRowSelected(payload.row, "InventoryItemID"),
        "InventoryItemID",
    );
};

/**
 * Điều hướng đến màn hình tạo mới hàng hóa.
 * @returns Không trả về giá trị.
 */
const onCreateItem = (): void => {
    window.alert("Cần cấu hình route chi tiết để tạo mới hàng hóa.");
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

.inventory-item-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 12px 0;
    height: 100%;
    min-height: 0;
}

.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.page-content {
    padding: 0 12px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.table-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.page-title {
    margin: 0;
    font-size: 24px;
    color: $color-text-black;
    font-weight: 700;
}

.page-subtitle {
    margin: 6px 0 0;
    color: #4b5563;
}

.page-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.search-bar {
    padding: 12px 0;
    background: #ffffff;
}

.status-active,
.status-inactive {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    height: 24px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
}

.status-active {
    background: #d1fae5;
    color: #047857;
}

.status-inactive {
    background: #fee2e2;
    color: #b91c1c;
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
    }

    .search-bar {
        grid-template-columns: 1fr;
    }
}
</style>
