<template>
    <div class="saorder-pos">
        <!-- ── HEADER TABS ── -->
        <div class="saorder-pos_header">
            <div class="tab-container">
                <div
                    v-for="tabOrder in orderList"
                    :key="tabOrder.tabID"
                    class="tab-item"
                    :class="{ active: tabOrder.tabID === activeTab.tabID }"
                    @click="setActiveTab(tabOrder as OrderTab)"
                >
                    <div class="tab-title">{{ tabOrder.title }}</div>
                    <div @click.stop="closeOrderTab(tabOrder.tabID)" class="icon-close16"></div>
                </div>

                <div class="tab-divider"></div>

                <div class="action-group">
                    <BaseButton
                        class="btn-add-order"
                        icon-right="icon-plus-primary"
                        size="sm"
                        @click="createNewOrder"
                        :disabled="isMaxTabsReached"
                    >
                        {{ $t("i18nSAOrder.CreateOrder") }}
                    </BaseButton>
                </div>
            </div>
        </div>

        <!-- ── BODY CONTENT ── -->
        <div class="saorder-pos_body">
            <!-- Left Side: Main Content Panel -->
            <div class="pos-content__main">
                <div class="flex items-center gap-4">
                    <SearchInventoryItem
                        @select-item="(inventoryItem) => handleSelectInventoryItem(inventoryItem, isGroupRows)"
                    />
                    <BaseSwitch v-model="isGroupRows" :label="$t('i18nSAOrder.POS.GroupRows')" />
                </div>

                <div class="main-selected-panel">
                    <div class="main-selected-panel__header">
                        <div>
                            <div class="main-selected-panel__title">
                                {{ $t("i18nSAOrder.POS.SelectedProducts") }}
                            </div>
                            <div class="main-selected-panel__subtitle">
                                {{
                                    $t("i18nSAOrder.POS.ProductCount", {
                                        count: activeOrder?.SAOrderDetails?.length ?? 0,
                                    })
                                }}
                            </div>
                        </div>
                        <div class="main-selected-panel__badge" v-if="orderSummary.totalAmount > 0">
                            {{ formatCurrency(orderSummary.totalAmount) }}
                        </div>
                    </div>

                    <!-- Products Table -->
                    <div v-if="currentOrderDetails.length > 0" class="main-selected-table-wrapper">
                        <table class="main-selected-table">
                            <thead>
                                <tr>
                                    <th
                                        v-for="column in tableColumns"
                                        :key="column.key"
                                        :class="[`col-${column.key}`, `is-${column.align}`]"
                                        :style="{ width: column.width }"
                                    >
                                        {{ column.label }}
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr
                                    v-for="orderDetail in currentOrderDetails"
                                    :key="orderDetail.RefDetailID"
                                    :class="{ 'is-active': selectedDetailID === orderDetail.RefDetailID }"
                                    @click="selectOrderDetail(orderDetail.RefDetailID)"
                                    class="main-selected-table__row"
                                >
                                    <td
                                        v-for="column in tableColumns"
                                        :key="column.key"
                                        :class="[`col-${column.key}`, `is-${column.align}`]"
                                        :style="{ width: column.width }"
                                        class="main-selected-table__col"
                                    >
                                        <!-- Serial Column -->
                                        <template v-if="column.key === 'serial'">
                                            <div class="flex items-center justify-center font-bold">
                                                {{ orderDetail.SortOrder }}
                                            </div>
                                        </template>

                                        <!-- Product Info Column -->
                                        <template v-if="column.key === 'product'">
                                            <div class="cell-product">
                                                <div class="cell-product__name">
                                                    {{ orderDetail.InventoryItemName }}
                                                </div>
                                                <div class="cell-product__code">
                                                    {{ orderDetail.InventoryItemCode }}
                                                </div>
                                            </div>
                                        </template>

                                        <!-- Unit Column -->
                                        <template v-else-if="column.key === 'unit'">
                                            {{ orderDetail.UnitName || orderDetail.MainUnitName || "-" }}
                                        </template>

                                        <!-- Quantity Column -->
                                        <template v-else-if="column.key === 'quantity'">
                                            <div class="flex justify-end">
                                                <BaseInputNumber
                                                    :model-value="orderDetail.Quantity"
                                                    :min="0"
                                                    :max-decimals="0"
                                                    :format-type="FormatType.Quantity"
                                                    @input="
                                                        (value: number | null) =>
                                                            updateItemQuantity(orderDetail as SAOrderDetail, value)
                                                    "
                                                    class="quantity-input"
                                                >
                                                    <template #left-icon>
                                                        <div
                                                            class="quantity-icon icon-decrease"
                                                            @click="decreaseItemQuantity(orderDetail as SAOrderDetail)"
                                                        ></div>
                                                    </template>
                                                    <template #right-icon>
                                                        <div
                                                            class="quantity-icon icon-plus"
                                                            @click="increaseItemQuantity(orderDetail as SAOrderDetail)"
                                                        ></div>
                                                    </template>
                                                </BaseInputNumber>
                                            </div>
                                        </template>

                                        <!-- Unit Price Column -->
                                        <template v-else-if="column.key === 'unit-price'">
                                            <BaseInputNumber
                                                :model-value="orderDetail.UnitPrice"
                                                :min="0"
                                                :format-type="FormatType.Currency"
                                                @input="
                                                    (value: number | null) =>
                                                        updateItemUnitPrice(orderDetail as SAOrderDetail, value)
                                                "
                                            />
                                        </template>

                                        <!-- Amount Column -->
                                        <template v-else-if="column.key === 'amount'">
                                            <BaseInputNumber
                                                :model-value="orderDetail.Amount"
                                                :min="0"
                                                :format-type="FormatType.Currency"
                                                @input="
                                                    (value: number | null) =>
                                                        updateItemAmount(orderDetail as SAOrderDetail, value)
                                                "
                                                class="input-amount"
                                            />
                                        </template>

                                        <!-- Actions Column -->
                                        <template v-else-if="column.key === 'action'">
                                            <div class="flex justify-end">
                                                <div
                                                    class="icon-trash-24"
                                                    @click.stop="removeOrderDetail(orderDetail.RefDetailID)"
                                                ></div>
                                            </div>
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Empty State -->
                    <div v-else class="main-selected-panel__empty">
                        <div class="text">
                            {{ $t("i18nSAOrder.POS.EmptyState") }}<br />
                            <span v-html="$t('i18nSAOrder.POS.SearchShortcut')"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resize Splitter Handle -->
            <div class="pos-content__resize-handle" @mousedown="initiateSidebarResize"></div>

            <!-- Right Side: Sidebar Info & Payment -->
            <div class="pos-content__sidebar" :style="{ width: `${sidebarWidth}px` }" v-if="activeOrder">
                <div class="sidebar-section">
                    <div class="sidebar-section__label">{{ $t("i18nSAOrder.POS.Cashier") }}</div>
                    <BaseCombobox
                        v-model="activeOrder.CashierName"
                        :store="cashierStore"
                        :autoLoad="false"
                        clearIcon
                        @change="handleCashierChange"
                        :placeholder="$t('i18nSAOrder.POS.CashierPlaceholder')"
                    />
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-section__label">{{ $t("i18nSAOrder.POS.Customer") }}</div>
                    <BaseCombobox
                        v-model="activeOrder.CustomerID"
                        :store="customerStore"
                        :autoLoad="false"
                        clearIcon
                        @change="handleCustomerChange"
                        :placeholder="$t('i18nSAOrder.POS.CustomerPlaceholder')"
                        :custom-display-text="formatCustomerDisplayText"
                    >
                        <template #item="{ item }">
                            <div class="cb-custom-item">
                                <div class="cb-custom-item__header">
                                    <span class="cb-custom-item__name">{{ item.CustomerName }}</span>
                                    <span class="cb-custom-item__code">{{ item.CustomerCode }}</span>
                                </div>
                                <div class="cb-custom-item__phone">
                                    <span>{{ item.PhoneNumber ?? "-" }}</span>
                                </div>
                            </div>
                        </template>
                    </BaseCombobox>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-section__label">{{ $t("i18nSAOrder.POS.OrderSummary") }}</div>
                    <div class="summary-row">
                        <span>{{ $t("i18nSAOrder.POS.SubTotal") }}</span>
                        <strong>{{ formatCurrency(orderSummary.totalAmount) }}</strong>
                    </div>
                    <div class="summary-row summary-row--discount">
                        <span>{{ $t("i18nSAOrder.POS.Discount") }}</span>
                        <div class="discount-input-wrap">
                            <BaseInputNumber
                                v-model="activeTab.discountValue"
                                :min="0"
                                :max="activeTab.discountType === 'percent' ? 100 : undefined"
                                :format-type="FormatType.Quantity"
                                class="discount-input"
                            />
                            <div class="discount-type-toggle">
                                <button
                                    class="discount-type-btn"
                                    :class="{ 'is-active': activeTab.discountType === 'percent' }"
                                    @click="chooseDiscount('percent')"
                                >
                                    %
                                </button>
                                <button
                                    class="discount-type-btn"
                                    :class="{ 'is-active': activeTab.discountType === 'amount' }"
                                    @click="chooseDiscount('amount')"
                                >
                                    ₫
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-row summary-row--total">
                        <span>{{ $t("i18nSAOrder.POS.NeedToPay") }}</span>
                        <strong class="summary-total-value">{{ formatCurrency(amountDue) }}</strong>
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-section__label">{{ $t("i18nSAOrder.POS.PaymentMethod") }}</div>
                    <div class="payment-method-grid">
                        <div
                            v-for="method in paymentMethods"
                            :key="method.value"
                            class="payment-method-btn"
                            :class="{ 'is-active': selectedPaymentMethod === method.value }"
                            @click="selectedPaymentMethod = method.value"
                        >
                            <div :class="method.icon"></div>
                            <span>{{ method.label }}</span>
                        </div>
                    </div>

                    <template v-if="selectedPaymentMethod === 'cash'">
                        <div class="cash-row">
                            <span class="cash-row__label">{{ $t("i18nSAOrder.POS.CustomerPaid") }}</span>
                            <BaseInputNumber
                                v-model="activeOrder.PaidAmount"
                                :min="0"
                                :format-type="FormatType.Currency"
                                class="cash-input"
                            />
                        </div>
                        <div
                            v-if="activeOrder.PaidAmount > 0"
                            class="change-row"
                            :class="{ 'is-positive': changeAmount > 0 }"
                        >
                            <span>{{ $t("i18nSAOrder.POS.Change") }}</span>
                            <strong>{{ formatCurrency(changeAmount) }}</strong>
                        </div>
                    </template>
                </div>

                <div class="sidebar-section">
                    <div class="sidebar-section__label">{{ $t("i18nSAOrder.POS.Note") }}</div>
                    <BaseTextArea
                        v-model="activeOrder.Description"
                        :placeholder="$t('i18nSAOrder.POS.NotePlaceholder')"
                    />
                </div>

                <div class="sidebar-checkout">
                    <BaseButton
                        class="checkout-btn"
                        variant="primary"
                        :disabled="currentOrderDetails.length === 0"
                        @click="handleCheckout"
                    >
                        <span>{{ $t("i18nSAOrder.POS.Checkout") }}</span>
                    </BaseButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted, getCurrentInstance } from "vue";
import { useI18n } from "vue-i18n";
import { FormatType } from "@/constants";
import SAOrder from "@/models/sales/SAOrder";
import SAOrderDetail from "@/models/sales/SAOrderDetail";
import SearchInventoryItem from "@/pages/sales/SearchInventoryItem.vue";
import { useOrderTabManager, type OrderTab } from "@/composables/sales/SAOrderPos/useOrderTabManager";
import { useOrderDetailActions } from "@/composables/sales/SAOrderPos/useOrderDetailActions";
import { useOrderSidebarResize } from "@/composables/sales/SAOrderPos/useOrderSidebarResize.ts";

/** Map PaymentMethod number từ model sang string key để dùng trong UI */
const PAYMENT_METHOD_MAP = {
    cash: 1,
    card: 2,
    transfer: 3,
} as const;
type PaymentMethodKey = keyof typeof PAYMENT_METHOD_MAP;

export default defineComponent({
    name: "SAOrderPOS",
    components: {
        SearchInventoryItem,
    },
    setup() {
        const { proxy } = getCurrentInstance() as any;

        // #region CONFIG & LOCAL STATES
        const { t } = useI18n();

        const tableColumns = [
            { key: "serial", label: "", align: "center", width: "50px" },
            { key: "product", label: t("i18nSAOrder.POS.ColProduct"), align: "left" },
            { key: "unit", label: t("i18nSAOrder.POS.ColUnit"), align: "left", width: "140px" },
            { key: "quantity", label: t("i18nSAOrder.POS.ColQuantity"), align: "right", width: "140px" },
            { key: "unit-price", label: t("i18nSAOrder.POS.ColUnitPrice"), align: "right", width: "160px" },
            { key: "amount", label: t("i18nSAOrder.POS.ColAmount"), align: "right", width: "170px" },
            { key: "action", label: "", align: "right", width: "100px" },
        ];

        const isGroupRows = ref(localStorage.getItem("saorder_pos_group_rows") !== "false");

        watch(isGroupRows, (val) => {
            localStorage.setItem("saorder_pos_group_rows", String(val));
        });

        const paymentMethods: { value: PaymentMethodKey; label: string; icon: string }[] = [
            { value: "cash", label: t("i18nSAOrder.POS.PayCash"), icon: "icon-cash-24" },
            { value: "card", label: t("i18nSAOrder.POS.PayCard"), icon: "icon-card-24" },
            { value: "transfer", label: t("i18nSAOrder.POS.PayTransfer"), icon: "icon-bank-24" },
        ];
        // #endregion

        // #region COMPOSABLES
        const { orderList, activeOrder, activeTab, isMaxTabsReached, createNewOrder, setActiveTab, closeOrderTab } =
            useOrderTabManager();

        const {
            selectedDetailID,
            currentOrderDetails,
            orderSummary,
            customerStore,
            cashierStore,
            selectOrderDetail,
            updateItemQuantity,
            increaseItemQuantity,
            decreaseItemQuantity,
            updateItemUnitPrice,
            updateItemAmount,
            removeOrderDetail,
            handleSelectInventoryItem,
            handleCustomerChange,
            formatCustomerDisplayText,
            handleCashierChange,
            chooseDiscount,
        } = useOrderDetailActions(activeOrder, activeTab);

        const { sidebarWidth, initiateSidebarResize } = useOrderSidebarResize();
        // #endregion

        // #region PAYMENT STATE
        /**
         * lvhung - 05.07.2026
         * UI key của phương thức thanh toán đang chọn — sync 2 chiều với activeOrder.PaymentMethod (number).
         */
        const selectedPaymentMethod = computed<PaymentMethodKey>({
            get: () => {
                const val = activeOrder.value?.PaymentMethod ?? 1;
                return (
                    (Object.entries(PAYMENT_METHOD_MAP).find(([, num]) => num === val)?.[0] as PaymentMethodKey) ??
                    "cash"
                );
            },
            set: (key: PaymentMethodKey) => {
                if (!activeOrder.value) return;
                activeOrder.value.PaymentMethod = PAYMENT_METHOD_MAP[key];
            },
        });

        /**
         * lvhung - 05.07.2026
         * Số tiền giảm giá thực tế — computed từ discountValue + discountType,
         * đồng thời sync vào activeOrder.DiscountAmount.
         */
        const discountAmount = computed<number>({
            get: () => activeOrder.value?.DiscountAmount ?? 0,
            set: (val: number) => {
                if (!activeOrder.value) return;
                activeOrder.value.DiscountAmount = val;
            },
        });

        /**
         * lvhung - 05.07.2026
         * Số tiền cần thanh toán = SubTotalAmount - DiscountAmount.
         * Đọc từ orderSummary.totalAmount (reactive theo SAOrderDetails) trừ discountAmount.
         */
        const amountDue = computed<number>(() => {
            return Math.max(0, orderSummary.value.totalAmount - discountAmount.value);
        });

        /**
         * lvhung - 05.07.2026
         * Tiền thừa trả lại khách = PaidAmount - amountDue.
         * Bind 2 chiều với activeOrder.ChangeAmount.
         */
        const changeAmount = computed<number>(() => {
            return Math.max(0, (activeOrder.value?.PaidAmount ?? 0) - amountDue.value);
        });

        /**
         * lvhung - 05.07.2026
         * Cập nhật discountAmount vào model mỗi khi discountValue hoặc discountType thay đổi.
         */
        watch([() => activeTab.value.discountValue, () => activeTab.value.discountType], () => {
            if (!activeOrder.value) return;
            const total = orderSummary.value.totalAmount;
            if (activeTab.value.discountType === "percent") {
                activeOrder.value.DiscountAmount = Math.round((total * activeTab.value.discountValue) / 100);
            } else {
                activeOrder.value.DiscountAmount = activeTab.value.discountValue;
            }
        });
        // #endregion

        // #region HELPERS & UTILS
        /**
         * lvhung - 05.07.2026
         * Định dạng giá trị số thành chuỗi tiền tệ VND (vi-VN).
         * @param value Giá trị số cần định dạng.
         */
        function formatCurrency(value: number): string {
            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
        }
        // #endregion

        // #region ACTIONS
        /**
         * lvhung - 05.07.2026
         * Xử lý sự kiện nhấn nút Thanh toán.
         * TODO: tích hợp useOrderPayment khi implement flow thanh toán đầy đủ.
         */
        function handleCheckout(): void {
            // placeholder — sẽ gọi useOrderPayment.submitPayment() sau
        }
        // #endregion

        // #region LIFECYCLE
        onMounted(() => {
            createNewOrder();
            (window as any)._pos = proxy;
        });
        // #endregion

        return {
            // config
            tableColumns,
            isGroupRows,
            FormatType,
            paymentMethods,
            // tab
            orderList,
            activeOrder,
            isMaxTabsReached,
            createNewOrder,
            setActiveTab,
            closeOrderTab,
            activeTab,
            // detail
            selectedDetailID,
            currentOrderDetails,
            orderSummary,
            selectOrderDetail,
            updateItemQuantity,
            increaseItemQuantity,
            decreaseItemQuantity,
            updateItemUnitPrice,
            updateItemAmount,
            removeOrderDetail,
            handleSelectInventoryItem,
            // sidebar
            sidebarWidth,
            initiateSidebarResize,
            // customer
            customerStore,
            handleCustomerChange,
            formatCustomerDisplayText,
            // cashier
            cashierStore,
            handleCashierChange,
            // payment
            selectedPaymentMethod,
            discountAmount,
            amountDue,
            changeAmount,
            // helpers
            formatCurrency,
            handleCheckout,
            chooseDiscount,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

// #region VARIABLES
$tab-active-bg: #f0f5ff;
$tab-height: 38px;
$radius: 10px;
$corner-size: 12px;
// #endregion

// #region MAIN LAYOUT & STRUCTURE
.saorder-pos {
    position: fixed;
    inset: 0;
    z-index: 1000;

    .saorder-pos_header {
        height: 48px;
        width: 100%;
        background-color: $primary-color;
        display: flex;
        align-items: flex-end;
        padding: 0 16px;
        box-sizing: border-box;
        overflow: hidden;

        .tab-container {
            display: flex;
            align-items: flex-end;
            height: 100%;
        }

        .tab-item {
            position: relative;
            display: flex;
            align-items: center;
            height: $tab-height;
            padding: 0 16px;
            color: #c2d9ff;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            border-radius: $radius $radius 0 0;
            gap: 12px;

            .tab-title {
                white-space: nowrap;
            }

            &.active {
                background-color: $tab-active-bg;
                color: #374151;
                font-weight: 500;
                z-index: 2;

                &::before {
                    content: "";
                    position: absolute;
                    bottom: 0;
                    left: -$corner-size;
                    width: $corner-size;
                    height: $corner-size;
                    background-color: $primary-color;
                    border-bottom-right-radius: $corner-size;
                    box-shadow: ($corner-size / 2) ($corner-size / 2) 0 ($corner-size / 2) $tab-active-bg;
                }

                &::after {
                    content: "";
                    position: absolute;
                    bottom: 0;
                    right: -$corner-size;
                    width: $corner-size;
                    height: $corner-size;
                    background-color: $primary-color;
                    border-bottom-left-radius: $corner-size;
                    box-shadow: (-$corner-size / 2) ($corner-size / 2) 0 ($corner-size / 2) $tab-active-bg;
                }
            }
        }

        .tab-divider {
            width: 1px;
            height: 18px;
            background-color: #d1d5db;
            margin: 0 12px 12px 12px;
        }

        .action-group {
            display: flex;
            align-items: center;
            margin-bottom: 6px;

            .btn-add-order {
                color: $primary-color;
                border-color: unset !important;
            }
        }
    }

    .saorder-pos_body {
        height: calc(100% - 48px);
        background-color: $tab-active-bg;
        width: 100%;
        display: flex;
        padding: 12px;
        box-sizing: border-box;
        overflow: hidden;

        .pos-content__main {
            flex: 1;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 16px;
            box-sizing: border-box;
            overflow-y: auto;
            min-width: 0;
        }
    }
}
// #endregion

// #region SELECTED ITEMS PANEL & TABLE
.saorder-pos {
    .saorder-pos_body {
        .main-selected-panel {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            height: calc(100% - 54px);
        }

        .main-selected-panel__header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }

        .main-selected-panel__title {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
        }

        .main-selected-panel__subtitle {
            margin-top: 4px;
            font-size: 12px;
            color: #6b7280;
        }

        .main-selected-panel__badge {
            padding: 6px 10px;
            border-radius: 999px;
            background-color: #eff6ff;
            color: $primary-color;
            font-weight: 700;
            font-size: 14px;
            white-space: nowrap;
        }

        .main-selected-table-wrapper {
            overflow: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #ffffff;
        }

        .main-selected-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            min-width: 920px;

            thead th {
                position: sticky;
                top: 0;
                z-index: 1;
                background: #f8fafc;
                color: #475569;
                font-size: 14px;
                font-weight: 700;
                letter-spacing: 0.02em;
                padding: 12px 24px 12px 12px;
                border-bottom: 1px solid #e5e7eb;
                white-space: nowrap;

                &.is-left {
                    text-align: left;
                }
                &.is-right {
                    text-align: right;
                }
            }
        }

        .main-selected-table__col {
            padding: 12px;
            border-bottom: 1px solid #eef2f7;
            vertical-align: top;
            &.is-left {
                text-align: left;
            }
            &.is-right {
                text-align: right;
            }
        }

        .main-selected-table__row {
            cursor: pointer;
            transition: background-color 0.15s ease;

            &:last-child td {
                border-bottom: none;
            }

            &.is-active,
            &:hover {
                background-color: #eff4fe;
            }

            :deep .base-input-number {
                border: unset;
            }
        }

        .col-unit {
            white-space: nowrap;
            color: #374151;
            font-size: 13px;
        }

        .cell-product__name {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            line-height: 1.4;
        }

        .cell-product__code {
            margin-top: 4px;
            font-size: 12px;
            color: #6b7280;
        }

        .main-selected-panel__empty {
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            background: #f8fafc;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            .text {
                color: #64748b;
                font-size: 14px;
                text-align: center;
            }
        }
    }
}
// #endregion

// #region SPLITTER HANDLE & SIDEBAR LAYOUT
.saorder-pos {
    .saorder-pos_body {
        .pos-content__resize-handle {
            width: 12px;
            cursor: col-resize;
            position: relative;
            user-select: none;

            &::before {
                content: "";
                position: absolute;
                top: 0;
                bottom: 0;
                left: 50%;
                width: 2px;
                transform: translateX(-50%);
                border-radius: 999px;
                background-color: transparent;
            }

            &:hover::before {
                background-color: $primary-color;
                opacity: 0.8;
            }
        }

        .pos-content__sidebar {
            background-color: #ffffff;
            border-radius: 8px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-width: 0;
            overflow: hidden;
        }
    }
}
// #endregion

// #region SIDEBAR SECTIONS
.sidebar-section {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &__label {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
}

.summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: #374151;

    &--discount {
        align-items: center;
    }

    &--total {
        padding-top: 4px;

        span {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
        }
    }
}

.summary-total-value {
    font-size: 17px;
    font-weight: 700;
    color: $primary-color;
}

.summary-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 2px 0;
}

.discount-input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
}

.discount-input {
    width: 80px;
}

.discount-type-toggle {
    display: flex;
    border: 1px solid $primary-color;
    border-radius: 8px;
    overflow: hidden;
}

.discount-type-btn {
    width: 30px;
    height: 28px;
    border: none;
    background: #f9fafb;
    color: #6b7280;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition:
        background 0.12s,
        color 0.12s;

    & + & {
        border-left: 1px solid #e5e7eb;
    }

    &.is-active {
        background: $primary-color;
        color: #ffffff;
    }
}
// #endregion

// #region PAYMENT METHOD
.payment-method-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
}

.payment-method-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    cursor: pointer;
    transition:
        border-color 0.12s,
        background 0.12s;

    span {
        font-size: 12px;
        color: #6b7280;
        white-space: nowrap;
    }

    &.is-active {
        border-color: $primary-color;
        background: #eff6ff;

        span {
            color: $primary-color;
            font-weight: 600;
        }
    }

    &:hover:not(.is-active) {
        border-color: #d1d5db;
        background: #f3f4f6;
    }
}

.cash-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;

    &__label {
        font-size: 13px;
        color: #6b7280;
        white-space: nowrap;
    }
}

.cash-input {
    width: 140px;
}

.change-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 8px;
    background: #f3f4f6;
    font-size: 13px;
    color: #6b7280;

    strong {
        color: #374151;
    }

    &.is-positive {
        background: #f0fdf4;
        color: #166534;

        strong {
            color: #16a34a;
            font-size: 15px;
        }
    }
}
// #endregion

// #region CHECKOUT BUTTON
.sidebar-checkout {
    padding: 12px 16px 16px;
    margin-top: auto;
}

.checkout-btn {
    width: 100%;
    height: 56px;

    span {
        font-size: 16px;
        font-weight: 600;
    }
}
// #endregion

// #region CUSTOM CONTROLS SPECIFIC STYLES
.quantity-input {
    width: 100px;
    :deep .base-input-number {
        text-align: center;
    }
    .quantity-icon {
        background-color: #e5e7eb;
        border-radius: 50%;
    }
}

.input-amount {
    :deep .base-input-number {
        font-weight: 800;
        font-size: 14px;
    }
}

.cb-custom-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
    box-sizing: border-box;

    &:last-child {
        border-bottom: none;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    &__name {
        font-weight: 500;
        color: #1f2937;
    }

    &__code {
        font-size: 12px;
        font-weight: 600;
        color: $primary-color;
        background-color: #eff6ff;
        padding: 2px 6px;
        border-radius: 4px;
    }

    &__phone {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #6b7280;
        margin-top: 2px;
    }
}
// #endregion
</style>
