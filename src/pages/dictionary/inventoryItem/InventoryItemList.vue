<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">Danh mục hàng hóa</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="onCreateItem">Thêm hàng hóa</BaseButton>
            </div>
        </div>
        <div class="page-content">
            <div class="flex justify-between search-bar">
                <div class="flex gap-2"></div>
                <div class="flex gap-2">
                    <BaseInput v-model="searchKeyword" size="sm" placeholder="Tìm kiếm" @change="onSearch" />
                    <BaseButton size="sm" @click="refresh" icon-left="icon-refresh rotate-y-180"></BaseButton>
                    <BaseButton size="sm" icon-left="icon-filter" @click="deleteItem"></BaseButton>
                    <BaseButton size="sm" icon-left="icon-setting scale-[0.85]"></BaseButton>
                </div>
            </div>
            <div class="table-container">
                <BaseTable
                    :store="tableStore"
                    :columns="tableColumns"
                    :auto-load="false"
                    :show-selection="true"
                    empty-text="Không có dữ liệu"
                    @row-action-click="onListItemAction"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemApi";
import { FormatType } from "@/constants";

const searchKeyword = ref<string>("");

const tableColumns: ColumnDefinition[] = [
    { dataField: "InventoryItemCode", title: "Mã hàng", width: 140, align: "left", visible: true },
    { dataField: "InventoryItemName", title: "Tên hàng hóa", width: 260, align: "left", visible: true },
    { dataField: "InventoryItemCategoryNameList", title: "Nhóm hàng", width: 180, align: "left", visible: true },
    { dataField: "UnitName", title: "Đơn vị tính", width: 120, align: "left", visible: true },
    {
        dataField: "BuyPrice",
        title: "Giá vốn",
        width: 140,
        align: "right",
        visible: true,
        formatType: FormatType.Currency,
    },
    {
        dataField: "SellPrice",
        title: "Giá bán",
        width: 140,
        align: "right",
        visible: true,
        formatType: FormatType.Currency,
    },
    {
        dataField: "QuantityBalance",
        title: "Tồn kho",
        width: 110,
        align: "right",
        visible: true,
        formatType: FormatType.Quantity,
    },
    // { dataField: "Inactive", title: "Trạng thái", width: 160, align: "center", visible: true },
];

/**
 * Validate nghiệp vụ trước khi xóa hàng hóa.
 * @param payload Dữ liệu validate trước khi xóa.
 * @returns `true` nếu user đồng ý xóa, ngược lại `false`.
 */
const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) return false;
    return true;
};

/**
 * Store quản lý trạng thái và dữ liệu của bảng hàng hóa.
 * Cấu hình chế độ truy vấn dữ liệu từ server và hàm tải dữ liệu.
 */
const tableStore = useTableStore("inventory_item", {
    keyID: "InventoryItemID",
    viewOrTableName: "di_inventory_item",
    columns: tableColumns,
    tableLoadData: (payload) => loadListData(payload),
});

/**
 * Sử dụng composable useBaseList để xử lý logic chung cho các trang danh sách, bao gồm:
 * - loadListData: Hàm tải dữ liệu từ API dựa trên payload của tableStore.
 * - search: Hàm thực hiện tìm kiếm với từ khóa hiện tại.
 */
const { loadListData, onSearch, refresh, deleteItem, onListItemAction } = useBaseList({
    formID: "InventoryItemList",
    tableStore,
    api: inventoryItemApi,
    rowKey: "InventoryItemID",
    validateBeforeDelete,
});

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

.list-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
    border-radius: 4px;
}

.table-container {
    flex: 1;
    min-height: 0;
}

.page-title {
    margin: 0;
    font-size: 20px;
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
