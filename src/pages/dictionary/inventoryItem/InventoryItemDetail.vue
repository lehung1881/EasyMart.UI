<template>
    <BasePopup
        :title="$t('i18nInventoryItem.Detail.Title')"
        width="820px"
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
                        @change="onUnitChange"
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
                <div class="flex flex-col gap-2 max-h-[220px]">
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-[13px] font-semibold text-[#1f2937]"> Đơn vị chuyển đổi </span>
                    </div>
                    <BaseTableEditor
                        ref="refUnitConvert"
                        v-model="model.InventoryItemUnitConverts"
                        :columns="unitConversionsColumns"
                        :show-selection="false"
                        row-key="UnitConvertID"
                        :defaultDataAddRow="defaultUnitConversion"
                        :editorProps="editorProps"
                        showSerial
                        @selected="onUnitConversionSelected"
                        @before-selected="onUnitConversionBeforeSelected"
                        :show-pagination="false"
                    />
                    <div class="flex gap-2">
                        <BaseButton
                            variant="outline-primary"
                            size="sm"
                            @click="() => refUnitConvert?.addRow()"
                            :disabled="model.InventoryItemUnitConverts.length >= 5"
                            >Thêm dòng</BaseButton
                        >
                        <BaseButton
                            size="sm"
                            @click="() => refUnitConvert?.removeAllRow()"
                            :disabled="model.InventoryItemUnitConverts?.length == 0"
                        >
                            Xóa hết dòng
                        </BaseButton>
                    </div>
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
import { FormatType, ColumnType, FilterOperator, DataType } from "@/constants";
import { showError } from "@/commons/messageBox";
import type { PagingRequest } from "@/models/common/paging";

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

        const refUnitConvert = ref(null);

        /**
         * Ngầm định thêm dòng
         */
        const defaultUnitConversion = reactive({
            UnitConversionID: null,
            UnitID: null,
            UnitName: "",
            ExhangeRateOperator: 1,
            ExhangeRateOperatorText: "Phép nhân",
            ConvertRate: 1,
            Description: "",
        });

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
         * Xử lý load dữ liệu combobox
         * @param payload
         */
        const comboboxGridUnitLoadData = async (payload: PagingRequest) => {
            if (!proxy.model.UnitID) {
                return [];
            }

            payload.filter = [
                {
                    property: "UnitID",
                    operator: FilterOperator.NotEqual,
                    value: proxy.model.UnitID,
                    dataType: DataType.String,
                },
            ];

            return await loadDataRemoteCombobox(unitAPI, payload);
        };

        /**
         * Thiết lập cấu hình cho các cell edit
         */
        const editorProps = reactive({
            UnitID: {
                store: useComboboxStore("unit", {
                    viewOrTableName: "di_unit",
                    comboboxLoadData: comboboxGridUnitLoadData,
                    displayField: "UnitName",
                    valueField: "UnitID",
                }),
                autoLoad: false,
            },
            ExhangeRateOperator: {
                store: useComboboxStore("unit_conversion_operator", {
                    queryMode: "local",
                    data: [
                        { Value: 1, Text: "Phép nhân" },
                        { Value: 2, Text: "Phép chia" },
                    ],
                    displayField: "Text",
                    valueField: "Value",
                }),
                autoLoad: true,
                searchable: false,
            },
            ConvertRate: {
                min: 0.000001,
            },
            Description: {
                readonly: true,
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
                width: 150,
                columnType: ColumnType.Combobox,
                editable: true,
            },
            {
                dataField: "ExhangeRateOperator",
                displayField: "ExhangeRateOperatorText",
                title: "Phép tính",
                width: 150,
                required: true,
                columnType: ColumnType.Combobox,
                editable: true,
            },
            {
                dataField: "ConvertRate",
                title: "Tỷ lệ chuyển đổi",
                width: 150,
                required: true,
                columnType: ColumnType.InputNumber,
                formatType: FormatType.Quantity,
                align: "right",
                editable: true,
            },
            {
                dataField: "Description",
                title: "Mô tả",
                columnType: ColumnType.DisplayOnly,
                editable: false,
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
            syncAllUnitConversionDescriptions();
        };

        /**
         * Lấy text hiển thị của phép tính từ mã ExhangeRateOperator.
         * @param operator Mã phép tính của dòng quy đổi.
         * @returns Chuỗi hiển thị tương ứng.
         */
        const getOperatorText = (operator: number): string => {
            switch (operator) {
                case 2:
                    return "Phép chia";
                case 1:
                default:
                    return "Phép nhân";
            }
        };

        /**
         * Build text mô tả quy đổi theo format nghiệp vụ.
         * @param row Dòng quy đổi cần build description.
         * @returns Chuỗi mô tả quy đổi.
         */
        const buildUnitConversionDescription = (row: any): string => {
            const unitName = row?.UnitName ?? "";
            const unitMain = proxy.model?.UnitName ?? "";
            const rate = Number(row?.ConvertRate ?? 0);
            const normalizedRate = Number.isFinite(rate) && rate > 0 ? rate : 0;

            if (!unitName || !unitMain || normalizedRate <= 0) {
                return "";
            }

            if (row?.ExhangeRateOperator === 2) {
                return `1 ${unitName} = 1/${normalizedRate} ${unitMain}`;
            }
            return `1 ${unitName} = ${normalizedRate} ${unitMain}`;
        };

        /**
         * Đồng bộ text ExhangeRateOperator và Description cho một dòng quy đổi.
         * @param row Dòng quy đổi cần đồng bộ.
         * @returns Không trả về giá trị.
         */
        const syncUnitConversionDescription = (row: any): void => {
            if (!row) {
                return;
            }

            const normalizedOperator = Number(row.ExhangeRateOperator ?? 1) === 2 ? 2 : 1;
            row.ExhangeRateOperator = normalizedOperator;
            row.ExhangeRateOperatorText = getOperatorText(normalizedOperator);
            row.Description = buildUnitConversionDescription(row);
        };

        /**
         * Đồng bộ Description cho toàn bộ danh sách đơn vị chuyển đổi.
         * @returns Không trả về giá trị.
         */
        const syncAllUnitConversionDescriptions = (): void => {
            const rows = proxy.model?.InventoryItemUnitConverts ?? [];
            rows.forEach((row: any) => {
                syncUnitConversionDescription(row);
            });
        };

        /**
         * Xử lý khi chọn dữ liệu ở cell editor của bảng đơn vị chuyển đổi.
         * @param row Dòng đang được chỉnh sửa trong bảng.
         * @param column Cấu hình cột phát sinh sự kiện.
         * @param selectedItem Item được chọn từ combobox trong cell.
         * @returns Không trả về giá trị.
         */
        const onUnitConversionSelected = (row: any, column: any, selectedItem: any): void => {
            if (!row || !column) {
                return;
            }

            switch (column.dataField) {
                case "UnitID":
                    row.UnitName = selectedItem?.UnitName ?? "";
                    break;
                case "ExhangeRateOperator":
                    row.ExhangeRateOperatorText = selectedItem?.Text ?? "";
                    break;
                default:
                    break;
            }

            syncUnitConversionDescription(row);
        };

        /**
         * Xử lý sự kiện Change
         * @param value
         */
        const onUnitChange = (value: any) => {
            if (!value) proxy.model.UnitName = null;
            syncAllUnitConversionDescriptions();
        };

        /**
         * Validate trước khi chọn đơn vị chuyển đổi
         * @param row
         * @param column
         * @param metaData
         */
        const onUnitConversionBeforeSelected = (row: any, column: any, metaData: any): void => {
            if (!row || !column) {
                return;
            }

            const item = metaData.newValue;

            switch (column.dataField) {
                case "UnitID":
                    if (item.UnitID === proxy.model.UnitID) {
                        showError("Đơn vị chính không được trùng với đơn vị chuyển đổi", "Cảnh báo");
                        metaData.allowSelect = false;
                    }
                    break;
                default:
                    break;
            }
        };

        /**
         * Kiểm tra xem UnitID chính có bị trùng trong danh sách InventoryItemUnitConverts hay không.
         * @returns {boolean}  true  ➜ hợp lệ
         *                     false ➜ trùng đơn vị, đã hiển thị cảnh báo
         */
        const customValidateBeforeSave = () => {
            // Không có dữ liệu hoặc không có danh sách chuyển đổi ⇒ hợp lệ
            if (!proxy.model.InventoryItemUnitConverts?.length) return true;

            const isDuplicated = proxy.model.InventoryItemUnitConverts.some(
                (item: any) => item.UnitID === proxy.model.UnitID,
            );

            if (isDuplicated) {
                showError("Đơn vị chính không được trùng với đơn vị chuyển đổi", "Cảnh báo");
                return false;
            }

            return true;
        };

        /**
         * Xử lý chuyển đổi dữ liệu khi lưu
         */
        const transformBeforeSave = () => {
            const lstUnitConverts = [];
            if (proxy.model.UnitID && proxy.model.InventoryItemUnitConverts?.length > 0) {
                lstUnitConverts.push(
                    {
                        UnitID: proxy.model.UnitID,
                        InventoryItemID: proxy.model.InventoryItemID,
                    },
                    ...proxy.model.InventoryItemUnitConverts,
                );
            }
            return {
                InventoryItemUnitConverts: lstUnitConverts,
            };
        };

        /**
         * Kế thừa logic chung cho Detail
         */
        const baseDetail = useBaseDetail<InventoryItemModel>({
            formID: "InventoryItemDetail",
            api: inventoryItemApi,
            createDefaultData: () => new InventoryItemModel(),
            customValidateBeforeSave: customValidateBeforeSave,
            transformBeforeSave: transformBeforeSave,
        });

        return {
            ...baseDetail,
            proxy,
            FormatType,
            unitStore,
            stockStore,
            inventoryItemTypeStore,
            unitConversionsColumns,
            refUnitConvert,
            defaultUnitConversion,
            editorProps,
            onUnitSelected,
            onUnitConversionSelected,
            onUnitConversionBeforeSelected,
            onUnitChange,
            customValidateBeforeSave,
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
