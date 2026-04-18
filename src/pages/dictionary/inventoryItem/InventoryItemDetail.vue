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
                <div class="flex flex-col gap-2 h-[250px]">
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-[13px] font-semibold text-[#1f2937]"> Đơn vị chuyển đổi </span>
                        <BaseButton size="sm" @click="addUnitConversion">Thêm dòng</BaseButton>
                    </div>
                    <BaseTableEditor
                        ref="unitTableRef"
                        v-model="model.UnitConversions"
                        :columns="unitConversionsColumns"
                        :show-selection="true"
                        row-key="UnitConversionID"
                        :defaultDataAddRow="defaultUnitConversion"
                        :editorProps="editorProps"
                    />
                </div>
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

<script lang="ts">
import { defineComponent, getCurrentInstance, reactive, ref } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import InventoryItemModel from "@/models/dictionary/inventoryItem";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/controls/useComboboxStore";
import unitAPI from "@/api/modules/dictionary/unitAPI";
import stockAPI from "@/api/modules/dictionary/stockAPI";
import { FormatType, ColumnType } from "@/constants";
import commonFunction from "@/commons/commonFunction";

export default defineComponent({
    name: "InventoryItemDetail",

    components: {
        BasePopup,
    },

    setup() {
        /**
         * Sử dụng getCurrentInstance để lấy proxy
         */
        const { proxy } = getCurrentInstance() as any;

        const unitTableRef = ref(null);

        const defaultUnitConversion = {
            UnitConversionID: null,
            UnitID: null,
            UnitName: "",
            ConversionRate: 1,
            Description: "",
        };

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
         * Thiết lập cấu hình cho các cell edit
         */
        const editorProps = reactive({
            UnitID: {
                store: useComboboxStore("unit_combobox", {
                    viewOrTableName: "di_unit",
                    comboboxLoadData: (pay) => loadDataRemoteCombobox(unitAPI, pay),
                    displayField: "UnitName",
                    valueField: "UnitID",
                }),
                autoLoad: false,
            },
            StockID: {
                store: useComboboxStore("stock_combobox", {
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
                }),
                autoLoad: false,
            },
        });

        /**
         * Định nghĩa cấu hình cột cho bảng đơn vị chuyển đổi
         */
        const unitConversionsColumns = [
            {
                dataField: "UnitID",
                displayField: "UnitName",
                title: "Đơn vị chuyển đổi",
                width: 200,
                columnType: ColumnType.Combobox,
                editable: true,
            },
            {
                dataField: "StockID",
                displayField: "StockName",
                title: "Kho",
                width: 200,
                columnType: ColumnType.Combobox,
                editable: true,
            },
            {
                dataField: "ConversionRate",
                title: "Tỷ lệ chuyển đổi",
                width: 150,
                required: true,
                columnType: ColumnType.InputNumber,
                formatType: FormatType.Quantity,
                editable: true,
            },
            {
                dataField: "Description",
                title: "Mô tả",
                width: 150,
                columnType: ColumnType.Input,
                editable: true,
            },
        ];

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

        /**
         * Xử lý khi chọn một đơn vị tính từ combobox
         * @param item
         */
        const onUnitSelected = (item: any): void => {
            proxy.model.UnitName = item.UnitName;
        };

        const addUnitConversion = () => {
            // Gọi hàm addRow của BaseTableEditor thông qua ref
            unitTableRef.value.addRow();
        };

        /**
         * Kế thừa logic chung cho Detail
         */
        const baseDetail = useBaseDetail<InventoryItemModel>({
            formID: "InventoryItemDetail",
            api: inventoryItemApi,
            createDefaultData: () => new InventoryItemModel(),
        });

        return {
            ...baseDetail,
            proxy,
            FormatType,
            unitStore,
            stockStore,
            inventoryItemTypeStore,
            unitConversionsColumns,
            unitTableRef,
            defaultUnitConversion,
            editorProps,
            onUnitSelected,
            addUnitConversion,
        };
    },
});
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
