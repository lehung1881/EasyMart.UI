<template>
    <BasePopup
        :show-icon-close="true"
        fullSize
        @beforeOpen="beforeOpen"
        :params="{}"
        class="sales-order-popup"
        :title="titleForm"
    >
        <!-- <template #header>
            <div class="modal-header-custom flex items-center gap-4 min-h-[56px] px-2">
                <div class="text-xl font-bold">{{  }}</div>
            </div>
        </template> -->

        <template #content>
            <div class="voucher-body flex flex-col gap-4">
                <div class="voucher-body__master grid grid-cols-12 gap-4">
                    <div class="info-card flex flex-col gap-4 col-span-7">
                        <div class="w-full flex gap-4">
                            <div class="info-card__body w-1/3">
                                <BaseInput
                                    v-model="model.CustomerID"
                                    :label="$t('i18nSAOrder.Detail.CustomerID')"
                                    class="w-full"
                                />
                                <BaseInput v-model="model.CashierName" label="Nhân viên thu ngân" class="w-full" />
                            </div>
                            <div class="info-card__body w-1/3">
                                <BaseInput
                                    v-model="model.CustomerName"
                                    :label="$t('i18nSAOrder.Detail.CustomerName')"
                                    class="w-full"
                                />
                            </div>
                            <div class="info-card__body w-1/3">
                                <BaseInput
                                    v-model="model.RefNo"
                                    :label="$t('i18nSAOrder.Detail.SAOrderCode')"
                                    class="w-full"
                                />
                                <BaseDatepicker
                                    v-model="model.RefDate"
                                    :label="$t('i18nSAOrder.Detail.OrderDate')"
                                    class="w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <BaseTextArea
                                v-model="model.Description"
                                :label="$t('i18nCommon.Description')"
                                class="w-full"
                                :rows="2"
                            />
                        </div>
                    </div>

                    <div class="info-card flex flex-col gap-4 col-span-2">
                        <div class="info-card__body">
                            <BaseCombobox
                                v-model="model.PaymentMethod"
                                label="Hình thức thanh toán"
                                :store="paymentMethodStore"
                                :searchable="false"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div class="info-card flex flex-col gap-4 col-span-3">
                        <div class="info-card__body">
                            <div class="total-line">
                                <span class="total-line__label">Tổng tiền hàng</span>
                                <span class="total-line__value">
                                    {{ formatData.formatCurrency(Number(model.SubTotalAmount ?? 0)) }}
                                </span>
                            </div>
                            <div class="total-line">
                                <span class="total-line__label">Giảm giá</span>
                                <span class="total-line__value">
                                    {{ formatData.formatCurrency(Number(model.DiscountAmount ?? 0)) }}
                                </span>
                            </div>
                            <div class="total-line">
                                <span class="total-line__label">Thuế VAT</span>
                                <span class="total-line__value">
                                    {{ formatData.formatCurrency(Number(model.TaxAmount ?? 0)) }}
                                </span>
                            </div>

                            <!-- <div class="total-line">
                                <span class="total-line__label">Khách đã trả</span>
                                <span class="total-line__value">
                                    {{ formatData.formatCurrency(Number(model.PaidAmount ?? 0)) }}
                                </span>
                            </div>
                            <div class="total-line">
                                <span class="total-line__label">Tiền thối lại</span>
                                <span class="total-line__value">
                                    {{ formatData.formatCurrency(Number(model.ChangeAmount ?? 0)) }}
                                </span>
                            </div> -->
                            <div class="total-line total-line--strong">
                                <span class="total-line__label">Tổng thanh toán</span>
                                <span class="total-line__value">
                                    {{ formatData.formatCurrency(Number(model.TotalAmount ?? 0)) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="voucher-body__detail">
                    <div class="flex justify-between items-center">
                        <span class="font-medium text-[13px] font-semibold text-[#1f2937]">Chi tiết hàng hóa</span>
                    </div>

                    <div class="voucher-body__grid">
                        <BaseTableEditor
                            ref="orderItemsEditor"
                            v-model="model.SAOrderDetails"
                            :columns="orderItemColumns"
                            :show-selection="false"
                            row-key="RefDetailID"
                            :defaultDataAddRow="defaultOrderItem"
                            :editorProps="editorProps"
                            showSerial
                            :show-pagination="false"
                            @selected="onOrderItemSelected"
                            @before-selected="onOrderItemBeforeSelected"
                        />
                    </div>

                    <div class="flex gap-2">
                        <BaseButton variant="outline-primary" size="sm" @click="addOrderItem">Thêm dòng</BaseButton>
                        <BaseButton
                            size="sm"
                            @click="removeAllOrderItems"
                            :disabled="model.SAOrderDetails.length === 0"
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

<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";
import salesAPI from "@/api/modules/salesApi";
import inventoryItemAPI from "@/api/modules/dictionary/inventoryItemAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/controls/useComboboxStore";
import { formatData } from "@/commons/formatData";
import { ColumnType, FormatType } from "@/constants";
import SAOrder from "@/models/sales/SAOrder";

const { proxy } = getCurrentInstance();

/**
 * Tham chiếu đến BaseTableEditor để thao tác dòng hàng.
 */
const orderItemsEditor = ref<any>(null);

/**
 * Dòng chi tiết mặc định khi thêm mới.
 */
const defaultOrderItem = reactive({
    RefDetailID: null,
    RefID: null,
    InventoryItemID: null,
    InventoryItemCode: "",
    InventoryItemName: "",
    Description: "",
    UnitID: null,
    UnitName: null,
    MainUnitID: null,
    MainUnitName: null,
    Quantity: 1,
    MainQuantity: 0,
    UnitPrice: 0,
    MainUnitPrice: 0,
    DiscountRate: 0,
    DiscountAmount: 0,
    VatRate: 0,
    VatRateName: null,
    VatAmount: 0,
    Amount: 0,
    SortOrder: 1,
});

/**
 * Store combobox cho chọn hàng hóa trong dòng đơn hàng.
 */
const inventoryItemStore = useComboboxStore("sales_inventory_item", {
    viewOrTableName: "di_inventory_item",
    comboboxLoadData: (payload) => loadDataRemoteCombobox(inventoryItemAPI, payload),
    displayField: "InventoryItemName",
    valueField: "InventoryItemID",
});

/**
 * Store local cho hình thức thanh toán.
 */
const paymentMethodStore = useComboboxStore("sales_payment_method", {
    queryMode: "local",
    data: [
        { Value: 1, Text: "Tiền mặt" },
        { Value: 2, Text: "Chuyển khoản" },
        { Value: 3, Text: "Thẻ" },
    ],
    displayField: "Text",
    valueField: "Value",
});

/**
 * Cấu hình editor cho từng cột trong bảng dòng đơn hàng.
 */
const editorProps = reactive({
    InventoryItemID: {
        store: inventoryItemStore,
        autoLoad: true,
    },
    Quantity: {
        min: 1,
    },
    UnitPrice: {
        min: 0,
        formatType: FormatType.Currency,
    },
    Amount: {
        readonly: true,
    },
    Description: {
        readonly: false,
    },
});

/**
 * Cột hiển thị cho danh sách dòng hàng hóa.
 */
const orderItemColumns = [
    {
        dataField: "InventoryItemID",
        displayField: "InventoryItemName",
        title: "Hàng hóa",
        width: 240,
        columnType: ColumnType.Combobox,
        editable: true,
    },
    {
        dataField: "InventoryItemCode",
        title: "Mã hàng",
        width: 140,
        columnType: ColumnType.DisplayOnly,
        editable: false,
    },
    {
        dataField: "Quantity",
        title: "Số lượng",
        width: 120,
        columnType: ColumnType.InputNumber,
        formatType: FormatType.Quantity,
        align: "right",
        editable: true,
    },
    {
        dataField: "UnitPrice",
        title: "Đơn giá",
        width: 160,
        columnType: ColumnType.InputNumber,
        formatType: FormatType.Currency,
        align: "right",
        editable: true,
    },
    {
        dataField: "Amount",
        title: "Thành tiền",
        width: 160,
        columnType: ColumnType.InputNumber,
        formatType: FormatType.Currency,
        align: "right",
        editable: false,
    },
    {
        dataField: "Description",
        title: "Ghi chú",
        columnType: ColumnType.DisplayOnly,
        editable: false,
    },
];

/**
 * Đồng bộ thành tiền cho một dòng hàng.
 * @param row Dòng dữ liệu cần cập nhật.
 * @returns Không trả về dữ liệu.
 */
const syncOrderItemAmount = (row: any): void => {
    if (!row) {
        return;
    }

    const quantity = Number(row.Quantity ?? 0);
    const unitPrice = Number(row.UnitPrice ?? 0);
    row.Amount = Number.isFinite(quantity * unitPrice) ? quantity * unitPrice : 0;
};

/**
 * Xử lý khi chọn hàng hóa trên một dòng đơn.
 * @param row Dòng đang chỉnh sửa.
 * @param column Cột phát sinh sự kiện.
 * @param selectedItem Dữ liệu được chọn từ combobox.
 * @returns Không trả về dữ liệu.
 */
const onOrderItemSelected = (row: any, column: any, selectedItem: any): void => {
    if (!row || !column) {
        return;
    }

    if (column.dataField === "InventoryItemID") {
        row.InventoryItemCode = selectedItem?.InventoryItemCode ?? "";
        row.InventoryItemName = selectedItem?.InventoryItemName ?? "";
        row.UnitID = selectedItem?.UnitID ?? null;
        row.UnitName = selectedItem?.UnitName ?? null;
        row.MainUnitID = selectedItem?.MainUnitID ?? null;
        row.MainUnitName = selectedItem?.MainUnitName ?? null;
        if (!row.UnitPrice) {
            row.UnitPrice = selectedItem?.SellPrice ?? 0;
        }
    }

    syncOrderItemAmount(row);
};

/**
 * Chặn chọn dữ liệu khi giá trị không phù hợp.
 * @param row Dòng đang chỉnh sửa.
 * @param column Cột phát sinh sự kiện.
 * @param metaData Dữ liệu meta của sự kiện.
 * @returns Không trả về dữ liệu.
 */
const onOrderItemBeforeSelected = (row: any, column: any, metaData: any): void => {
    if (!row || !column) {
        return;
    }

    if (column.dataField === "InventoryItemID" && metaData?.newValue?.InventoryItemID === row.InventoryItemID) {
        metaData.allowSelect = true;
    }
};

/**
 * Thêm một dòng hàng mới vào bảng chi tiết.
 * @returns Không trả về dữ liệu.
 */
const addOrderItem = (): void => {
    orderItemsEditor.value?.addRow();
};

/**
 * Xóa toàn bộ dòng hàng hiện có.
 * @returns Không trả về dữ liệu.
 */
const removeAllOrderItems = (): void => {
    orderItemsEditor.value?.removeAllRow();
};

/**
 * Kiểm tra dữ liệu trước khi lưu đơn hàng.
 * @returns `true` nếu hợp lệ, ngược lại `false`.
 */
const customValidateBeforeSave = (): boolean => {
    if (!model.SAOrderDetails?.length) {
        return false;
    }

    model.SAOrderDetails.forEach((row) => {
        row.RefID = model.RefID;
        syncOrderItemAmount(row);
    });
    return true;
};

/**
 * Chuẩn hóa payload trước khi gửi lưu.
 * @returns Dữ liệu chi tiết đã được làm sạch.
 */
const transformBeforeSave = (): { SAOrderDetails: unknown[] } => {
    return {
        SAOrderDetails: (model.SAOrderDetails ?? [])
            .filter((item) => item.InventoryItemID)
            .map((item, index) => ({
                ...item,
                RefID: model.RefID,
                SortOrder: index + 1,
            })),
    };
};

const titleForm = computed(() => `${proxy.$t("i18nSAOrder.Detail.Title")} ${model.RefNo ?? ""}`);

/**
 * Kế thừa logic lưu detail cho đơn hàng bán.
 */
const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<SAOrder>({
    formID: "SAOrderDetail",
    api: salesAPI,
    createDefaultData: () => new SAOrder(),
    customValidateBeforeSave,
    transformBeforeSave,
});
</script>

<style scoped lang="scss">
.sales-order-popup :deep(.popup-content) {
    overflow: hidden;
}

.sales-order-popup :deep(.modal-body) {
    background-color: rgb(229, 231, 235);
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.voucher-body {
    flex: 1;
    height: 100%;
    min-height: 0;
    padding: 16px;
    background-color: rgb(229, 231, 235);
    display: flex;
    flex-direction: column;
    overflow: auto;
}

.voucher-body__master {
    // display: flex;
    // flex-wrap: wrap;
    gap: 16px;
}

.voucher-body__detail {
    padding: 16px;
    background: #fff;
    flex: 1;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-card {
    border-radius: 8px;
    background: #fff;
    padding: 16px;
    min-width: 0;
}

.info-card--span-3 {
    flex: 0 0 calc(25% - 12px);
    max-width: calc(25% - 12px);
}

.info-card--span-6 {
    flex: 0 0 calc(50% - 8px);
    max-width: calc(50% - 8px);
}

.info-card__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-card__body--two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
}

.total-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    // padding: 10px 12px;
    // border-radius: 10px;
    // background: #f9fafb;
    // border: 1px solid #e5e7eb;
}

.total-line__label {
    font-size: 13px;
    color: #4b5563;
    font-weight: 500;
}

.total-line__value {
    font-size: 14px;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
}

.total-line--strong {
    // background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    // border-color: #bfdbfe;
}

.total-line--strong .total-line__label {
    // color: #1d4ed8;
    font-weight: 700;
    font-size: 15px;
}

.total-line--strong .total-line__value {
    font-size: 16px;
}

@media (max-width: 1200px) {
    .info-card--span-6,
    .info-card--span-3 {
        flex: 0 0 100%;
        max-width: 100%;
    }
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
