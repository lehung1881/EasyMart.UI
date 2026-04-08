<template>
    <BasePopup
        title="Thêm mới hàng hóa"
        width="820px"
        :show-icon-close="true"
        @beforeOpen="beforeOpen"
        :params="{}"
        isRight
    >
        <template #content>
            <div class="inventory-item-detail">
                <!-- Tabs -->
                <div class="detail-tabs">
                    <div
                        v-for="tab in tabs"
                        :key="tab.key"
                        class="detail-tab flex items-center"
                        :class="{ 'detail-tab--active': activeTab === tab.key }"
                        @click="setActiveTab(tab.key)"
                    >
                        {{ tab.label }}
                    </div>
                </div>

                <!-- Tab: Thông tin chung -->
                <div v-if="activeTab === 'general'" class="detail-grid">
                    <BaseInput v-model="model.InventoryItemCode" label="Mã hàng hóa" />
                    <BaseInput v-model="model.InventoryItemName" label="Tên hàng hóa" required />
                    <BaseCombobox
                        v-model="model.InventoryItemType"
                        label="Loại hàng hóa"
                        :store="inventoryItemTypeStore"
                        :searchable="false"
                    />
                    <BaseCombobox
                        v-model="model.UnitID"
                        label="Đơn vị tính"
                        :store="unitStore"
                        clearIcon
                        autoLoad
                        @selected="onUnitSelected"
                    />
                    <BaseInput v-model="model.BuyPrice" type="number" label="Giá vốn" placeholder="0" />
                    <BaseInput v-model="model.SellPrice" type="number" label="Giá bán" placeholder="0" />
                    <BaseInput v-model="model.Description" label="Mô tả" class="col-span-2" />
                </div>

                <!-- Tab: Định mức tồn kho -->
                <div v-else-if="activeTab === 'stockNorm'" class="detail-grid">
                    <BaseCombobox v-model="model.StockID" label="Kho mặc định" :store="stockStore" clearIcon autoLoad />
                    <BaseInput v-model="model.MinimumStock" type="number" label="Tồn kho tối thiểu" placeholder="0" />
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">Hủy</BaseButton>
                <BaseButton size="md" variant="primary" :disabled="saving" @click="saveAndClose(close)">Lưu</BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import InventoryItemModel from "@/models/dictionary/inventoryItem";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/controls/useComboboxStore";
import unitAPI from "@/api/modules/dictionary/unitAPI";
import stockAPI from "@/api/modules/dictionary/stockAPI";

type InventoryDetailTab = "general" | "stockNorm" | "status";

const tabs: Array<{ key: InventoryDetailTab; label: string }> = [
    { key: "general", label: "Thông tin chung" },
    { key: "stockNorm", label: "Định mức tồn kho" },
];

const activeTab = ref<InventoryDetailTab>("general");

/**
 * Store cho combobox đơn vị tính
 */
const unitStore = useComboboxStore("unit_combobox", {
    viewOrTableName: "di_unit",
    comboboxLoadData: (pay) => loadDataRemoteCombobox(unitAPI, pay),
    displayField: "UnitName",
    valueField: "UnitID",
});

/**
 * Store cho combobox kho
 */
const stockStore = useComboboxStore("stock_combobox", {
    viewOrTableName: "di_stock",
    comboboxLoadData: (pay) => loadDataRemoteCombobox(stockAPI, pay),
    displayField: "StockName",
    valueField: "StockID",
    columns: [
        { dataField: "StockCode", title: "Mã kho", width: 120 },
        { dataField: "StockName", title: "Tên kho", width: 200 },
        { dataField: "Address", title: "Địa chỉ", width: 250 },
    ],
});

/**
 * Store cho combobox loại hàng hóa.
 */
const inventoryItemTypeStore = useComboboxStore("inventory_item_type_combobox", {
    viewOrTableName: "di_inventory_item_type",
    displayField: "InventoryItemTypeName",
    valueField: "InventoryItemType",
    queryMode: "local",
    data: [
        { InventoryItemTypeName: "Hàng hóa", InventoryItemType: 0 },
        { InventoryItemTypeName: "Dịch vụ", InventoryItemType: 1 },
    ],
});

const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<InventoryItemModel>({
    formID: "InventoryItemDetail",
    api: inventoryItemApi,
    createDefaultData: () => new InventoryItemModel(),
});

/**
 * Chuyển tab đang hiển thị trên form chi tiết hàng hóa.
 * @param tabKey Mã tab cần chuyển sang.
 */
const setActiveTab = (tabKey: InventoryDetailTab): void => {
    activeTab.value = tabKey;
};

/**
 * Xử lý khi chọn một đơn vị tính từ combobox
 * @param item
 */
const onUnitSelected = (item: any): void => {
    model.UnitName = item.UnitName;
};
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.inventory-item-detail {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
}

.detail-tabs {
    display: flex;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid #d1d5db;
}

.detail-tab {
    height: 24px;
    padding: 0 12px;
    border: 0;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    font-size: 14px;
    color: #111827;
    line-height: 1;
    cursor: pointer;
}

.detail-tab--active {
    color: $primary-color;
    border-bottom-color: $primary-color;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.col-span-2 {
    grid-column: span 2;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
