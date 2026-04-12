<template>
    <BasePopup
        :title="$t('i18nInventoryItem.Detail.Title')"
        width="720px"
        :show-icon-close="true"
        @beforeOpen="beforeOpen"
        :params="{}"
        isRight
    >
        <template #content>
            <div class="inventory-item-detail flex flex-col gap-4">
                <div class="flex gap-4 max-md:flex-col">
                    <BaseInput
                        v-model="model.InventoryItemCode"
                        :label="$t('i18nInventoryItem.Detail.InventoryItemCode')"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInput
                        v-model="model.InventoryItemName"
                        :label="$t('i18nInventoryItem.Detail.InventoryItemName')"
                        required
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseCombobox
                        v-model="model.InventoryItemType"
                        :label="$t('i18nInventoryItem.Detail.InventoryItemType')"
                        :store="inventoryItemTypeStore"
                        :searchable="false"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseCombobox
                        v-model="model.UnitID"
                        :label="$t('i18nInventoryItem.Detail.Unit')"
                        :store="unitStore"
                        :autoLoad="false"
                        clearIcon
                        :initText="model.UnitName"
                        @selected="onUnitSelected"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseCombobox
                        v-model="model.StockID"
                        :label="$t('i18nInventoryItem.Detail.DefaultStock')"
                        :store="stockStore"
                        autoLoad
                        clearIcon
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInputNumber
                        v-model="model.MinimumStock"
                        :label="$t('i18nInventoryItem.Detail.MinimumStock')"
                        placeholder="0"
                        :format-type="FormatType.Quantity"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseInputNumber
                        v-model="model.BuyPrice"
                        :label="$t('i18nInventoryItem.Detail.BuyPrice')"
                        :format-type="FormatType.Currency"
                        :min="0"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInputNumber
                        v-model="model.SellPrice"
                        :label="$t('i18nInventoryItem.Detail.SellPrice')"
                        :format-type="FormatType.Currency"
                        :min="0"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <BaseTextArea v-model="model.Description" :label="$t('i18nCommon.Description')" class="w-full" />
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">{{ $t("i18nCommon.Cancel") }}</BaseButton>
                <BaseButton size="md" variant="primary" :disabled="saving" @click="saveAndClose(close)">
                    {{ $t("i18nCommon.Save") }}
                </BaseButton>
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
        { dataField: "StockName", title: "Tên kho", width: 180 },
        { dataField: "Address", title: "Địa chỉ", width: 250 },
    ],
    dropdownWidth: 600,
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
