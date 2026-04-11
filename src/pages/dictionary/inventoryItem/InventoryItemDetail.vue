<template>
    <BasePopup
        title="Thêm mới hàng hóa"
        width="720px"
        :show-icon-close="true"
        @beforeOpen="beforeOpen"
        :params="{}"
        isRight
    >
        <template #content>
            <div class="inventory-item-detail flex flex-col gap-4">
                <div class="flex gap-4 max-md:flex-col">
                    <BaseInput v-model="model.InventoryItemCode" label="Mã hàng hóa" class="w-1/2 max-md:w-full" />
                    <BaseInput
                        v-model="model.InventoryItemName"
                        label="Tên hàng hóa"
                        required
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseCombobox
                        v-model="model.InventoryItemType"
                        label="Loại hàng hóa"
                        :store="inventoryItemTypeStore"
                        :searchable="false"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseCombobox
                        v-model="model.UnitID"
                        label="Đơn vị tính"
                        :store="unitStore"
                        clearIcon
                        autoLoad
                        @selected="onUnitSelected"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseCombobox
                        v-model="model.StockID"
                        label="Kho mặc định"
                        :store="stockStore"
                        clearIcon
                        autoLoad
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInputNumber
                        v-model="model.MinimumStock"
                        label="Tồn kho tối thiểu"
                        placeholder="0"
                        :format-type="FormatType.Quantity"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseInputNumber
                        v-model="model.BuyPrice"
                        label="Giá vốn"
                        :format-type="FormatType.Currency"
                        :min="0"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInputNumber
                        v-model="model.SellPrice"
                        label="Giá bán"
                        :format-type="FormatType.Currency"
                        :min="0"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <BaseTextArea v-model="model.Description" label="Mô tả" class="w-full" />
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
import BasePopup from "@/components/popup/BasePopup.vue";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import InventoryItemModel from "@/models/dictionary/inventoryItem";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/controls/useComboboxStore";
import unitAPI from "@/api/modules/dictionary/unitAPI";
import stockAPI from "@/api/modules/dictionary/stockAPI";
import { FormatType } from "@/constants";

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
 * Xử lý khi chọn một đơn vị tính từ combobox
 * @param item
 */
const onUnitSelected = (item: any): void => {
    model.UnitName = item.UnitName;
};
</script>

<style scoped lang="scss">
.inventory-item-detail {
    height: 100%;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
