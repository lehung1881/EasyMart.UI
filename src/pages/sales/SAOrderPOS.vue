<template>
    <div class="saorder-pos">
        <div class="saorder-pos_header">
            <div class="tab-container">
                <div
                    v-for="order in orders"
                    :key="order.RefID"
                    class="tab-item"
                    :class="{ active: order.RefID === currentOrder?.RefID }"
                    @click="setActiveOrder(order as SAOrder)"
                >
                    <div class="tab-title">{{ order.RefNo }}</div>
                    <div @click.stop="closeOrderTab(order.RefID)" class="icon-close16"></div>
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

        <div class="saorder-pos_body">
            <div class="pos-content__main">
                <div class="flex items-center gap-4">
                    <SearchInventoryItem @select-item="handleSelectInventoryItem" />
                    <BaseSwitch v-model="isGroupRows" label="Gộp dòng" />
                </div>

                <div class="main-selected-panel">
                    <div class="main-selected-panel__header">
                        <div>
                            <div class="main-selected-panel__title">Hàng hóa đã chọn</div>
                            <div class="main-selected-panel__subtitle">
                                {{ currentOrder?.SAOrderDetails?.length ?? 0 }} sản phẩm trong đơn
                            </div>
                        </div>
                        <div class="main-selected-panel__badge">
                            {{ formatCurrency(orderSummary.totalAmount) }}
                        </div>
                    </div>

                    <div v-if="orderDetails.length > 0" class="main-selected-table-wrapper">
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
                                    v-for="orderDetail in orderDetails"
                                    :key="orderDetail.RefDetailID"
                                    :class="{ 'is-active': selectedDetailID === orderDetail.RefDetailID }"
                                    @click="selectOrderDetail(orderDetail.RefDetailID)"
                                >
                                    <td
                                        v-for="column in tableColumns"
                                        :key="column.key"
                                        :class="[`col-${column.key}`, `is-${column.align}`]"
                                        :style="{ width: column.width }"
                                    >
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

                                        <template v-else-if="column.key === 'unit'">
                                            {{ orderDetail.UnitName || orderDetail.MainUnitName || "-" }}
                                        </template>

                                        <template v-else-if="column.key === 'quantity'">
                                            <div class="flex justify-end">
                                                <BaseInputNumber
                                                    :model-value="orderDetail.Quantity"
                                                    :min="0"
                                                    :max-decimals="0"
                                                    :format-type="FormatType.Quantity"
                                                    @input="
                                                        (value: any) =>
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

                                        <template v-else-if="column.key === 'unit-price'">
                                            <BaseInputNumber
                                                :model-value="orderDetail.UnitPrice"
                                                :min="0"
                                                :format-type="FormatType.Currency"
                                                @input="
                                                    (value: any) =>
                                                        updateItemUnitPrice(orderDetail as SAOrderDetail, value)
                                                "
                                            />
                                        </template>

                                        <template v-else-if="column.key === 'amount'">
                                            <BaseInputNumber
                                                :model-value="orderDetail.Amount"
                                                :min="0"
                                                :format-type="FormatType.Currency"
                                                @input="
                                                    (value: any) =>
                                                        updateItemAmount(orderDetail as SAOrderDetail, value)
                                                "
                                                class="input-amount"
                                            />
                                        </template>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="main-selected-panel__empty">
                        Chọn sản phẩm từ ô tìm kiếm để thêm vào danh sách hàng hóa.
                    </div>
                </div>
            </div>

            <div class="pos-content__resize-handle" @mousedown="initiateSidebarResize"></div>

            <div class="pos-content__sidebar" :style="{ width: `${sidebarWidth}px` }">
                <div class="sidebar-footer">
                    <div class="summary-row">
                        <span>Tạm tính</span>
                        <strong>{{ formatCurrency(orderSummary.totalAmount) }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Tổng số lượng</span>
                        <strong>{{ orderSummary.totalQuantity }}</strong>
                    </div>
                    <BaseButton class="w-full" type="primary" :disabled="orderDetails.length === 0">
                        Thanh toán
                    </BaseButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, onBeforeUnmount } from "vue";
import { FormatType } from "@/constants";
import SAOrder from "@/models/sales/SAOrder";
import SAOrderDetail from "@/models/sales/SAOrderDetail";
import SearchInventoryItem from "@/pages/sales/SearchInventoryItem.vue";

interface InventoryItemSearchResult {
    InventoryItemID: string;
    InventoryItemCode: string;
    InventoryItemName: string;
    SellPrice: number;
    MinimumStock: number;
    ImageUrl: string | null;
}

export default defineComponent({
    name: "SAOrderPOS",
    components: {
        SearchInventoryItem,
    },
    setup() {
        // Cấu hình các cột hiển thị trong bảng chi tiết hàng hóa
        const tableColumns = [
            { key: "product", label: "Hàng hóa", align: "left" },
            { key: "unit", label: "Đơn vị tính", align: "left", width: "140px" },
            { key: "quantity", label: "Số lượng", align: "right", width: "140px" },
            { key: "unit-price", label: "Đơn giá", align: "right", width: "160px" },
            { key: "amount", label: "Thành tiền", align: "right", width: "170px" },
        ];

        // Quản lý trạng thái đơn hàng & tabs
        const orders = ref<SAOrder[]>([]);
        const currentOrder = ref<SAOrder | null>(null);
        const isGroupRows = ref(true);

        // Quản lý kích thước Sidebar kéo dãn
        const sidebarWidth = ref(380);
        const MIN_SIDEBAR_WIDTH = 380;
        const MAX_SIDEBAR_WIDTH = 600;
        const isResizing = ref(false);
        const resizeStartX = ref(0);
        const resizeStartWidth = ref(380);

        /**
         * Chuyển đổi tab hiển thị sang một đơn hàng được chỉ định.
         * @param order Đối tượng đơn hàng cần kích hoạt.
         */
        const setActiveOrder = (order: SAOrder) => {
            currentOrder.value = order;
            selectedDetailID.value = null;
        };

        const selectOrderDetail = (refDetailID: string) => {
            selectedDetailID.value = refDetailID;
        };

        // Danh sách chi tiết hàng hóa của đơn hàng đang chọn
        const orderDetails = computed(() => currentOrder.value?.SAOrderDetails ?? []);
        const selectedDetailID = ref<string | null>(null);

        // Tổng hợp tổng số lượng và thành tiền của đơn hàng hiện tại
        const orderSummary = computed(() => {
            return orderDetails.value.reduce(
                (summary, detail) => {
                    summary.totalQuantity += Number(detail.Quantity ?? 0);
                    summary.totalAmount += Number(detail.Amount ?? 0);
                    return summary;
                },
                { totalQuantity: 0, totalAmount: 0 },
            );
        });

        /**
         * Định dạng giá trị số thành chuỗi tiền tệ VND (vi-VN).
         * @param value Giá trị số cần định dạng.
         */
        const formatCurrency = (value: number) => {
            return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
        };

        /**
         * Đồng bộ và cập nhật lại mảng chi tiết hàng hóa của đơn hàng hiện tại (Trigger reactivity).
         * @param details Mảng danh sách chi tiết hàng hóa mới.
         */
        const syncOrderDetails = (details: SAOrderDetail[]) => {
            if (!currentOrder.value) return;
            currentOrder.value.SAOrderDetails = details;
        };

        /**
         * Cập nhật số lượng của một mặt hàng trong đơn và tính lại thành tiền.
         * @param detail Đối tượng chi tiết hàng hóa cần cập nhật.
         * @param value Số lượng mới.
         */
        const updateItemQuantity = (detail: SAOrderDetail, value: number | null) => {
            if (!currentOrder.value) return;
            const nextValue = Math.max(0, Number(value ?? 0));
            detail.Quantity = nextValue;
            detail.MainQuantity = nextValue;
            detail.Amount = Number(detail.UnitPrice ?? 0) * nextValue;
            syncOrderDetails([...(currentOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
        };

        /**
         * Tăng số lượng mặt hàng lên 1 đơn vị.
         * @param detail Đối tượng chi tiết hàng hóa cần tăng số lượng.
         */
        const increaseItemQuantity = (detail: SAOrderDetail) => {
            updateItemQuantity(detail, Number(detail.Quantity ?? 0) + 1);
        };

        /**
         * Giảm số lượng mặt hàng đi 1 đơn vị.
         * @param detail Đối tượng chi tiết hàng hóa cần giảm số lượng.
         */
        const decreaseItemQuantity = (detail: SAOrderDetail) => {
            updateItemQuantity(detail, Number(detail.Quantity ?? 0) - 1);
        };

        /**
         * Cập nhật đơn giá của một mặt hàng trong đơn và tính lại thành tiền.
         * @param detail Đối tượng chi tiết hàng hóa cần cập nhật.
         * @param value Giá trị đơn giá mới.
         */
        const updateItemUnitPrice = (detail: SAOrderDetail, value: number | null) => {
            if (!currentOrder.value) return;
            const nextValue = Math.max(0, Number(value ?? 0));
            detail.UnitPrice = nextValue;
            detail.MainUnitPrice = nextValue;
            detail.Amount = nextValue * Number(detail.Quantity ?? 0);
            syncOrderDetails([...(currentOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
        };

        /**
         * Cập nhật thành tiền của một mặt hàng và tính ngược lại đơn giá tương ứng.
         * @param detail Đối tượng chi tiết hàng hóa cần cập nhật.
         * @param value Giá trị thành tiền mới.
         */
        const updateItemAmount = (detail: SAOrderDetail, value: number | null) => {
            if (!currentOrder.value) return;
            const nextValue = Math.max(0, Number(value ?? 0));
            detail.Amount = nextValue;
            const quantity = Number(detail.Quantity ?? 0);
            if (quantity > 0) {
                const nextUnitPrice = nextValue / quantity;
                detail.UnitPrice = nextUnitPrice;
                detail.MainUnitPrice = nextUnitPrice;
            }
            syncOrderDetails([...(currentOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
        };

        // Giới hạn tối đa cho phép mở 5 tabs đơn hàng đồng thời
        const isMaxTabsReached = computed(() => orders.value.length >= 5);

        /**
         * Đóng một tab đơn hàng. Nếu đóng tab hiện tại thì tự động kích hoạt tab kề cạnh hoặc tạo mới nếu trống.
         * @param refID ID của đơn hàng cần đóng tab.
         */
        const closeOrderTab = (refID: string) => {
            const index = orders.value.findIndex((item) => item.RefID === refID);
            if (index === -1) return;

            const isClosingActiveOrder = currentOrder.value?.RefID === refID;
            orders.value.splice(index, 1);

            if (isClosingActiveOrder) {
                currentOrder.value = orders.value[0] ?? null;
            }

            if (orders.value.length === 0) {
                createNewOrder();
            }
        };

        /**
         * Tạo mới một đơn hàng, sinh mã đơn tạm thời tăng dần và đưa lên đầu danh sách tabs.
         */
        const createNewOrder = () => {
            const nextId =
                orders.value.length > 0 ? Math.max(...orders.value.map((order) => Number(order.RefID) || 0)) + 1 : 1;

            const newOrder = new SAOrder({
                RefNo: `Đơn hàng ${nextId}`,
                SAOrderDetails: [],
            });

            newOrder.setAutoPrimaryKey();
            orders.value.unshift(newOrder);
            currentOrder.value = newOrder;
        };

        /**
         * Xử lý sự kiện chọn hàng hóa từ ô tìm kiếm. Nếu chưa có đơn hàng sẽ tạo mới,
         * nếu hàng hóa đã tồn tại thì tăng số lượng, ngược lại thêm mới dòng chi tiết.
         * @param item Đối tượng hàng hóa được chọn từ cổng kết quả tìm kiếm.
         */
        const handleSelectInventoryItem = (item: InventoryItemSearchResult) => {
            if (!currentOrder.value) {
                createNewOrder();
            }

            if (!currentOrder.value) return;

            const order = currentOrder.value;
            const details = [...(order.SAOrderDetails ?? [])];
            const existingDetail = isGroupRows.value
                ? details.find((detail) => detail.InventoryItemID === item.InventoryItemID)
                : null;

            if (existingDetail) {
                existingDetail.Quantity = Number(existingDetail.Quantity ?? 0) + 1;
                existingDetail.MainQuantity = Number(existingDetail.MainQuantity ?? 0) + 1;
                existingDetail.Amount = Number(existingDetail.UnitPrice ?? 0) * Number(existingDetail.Quantity ?? 0);
            } else {
                const newDetail = new SAOrderDetail({
                    InventoryItemID: item.InventoryItemID,
                    InventoryItemCode: item.InventoryItemCode,
                    InventoryItemName: item.InventoryItemName,
                    Quantity: 1,
                    MainQuantity: 1,
                    UnitPrice: item.SellPrice,
                    MainUnitPrice: item.SellPrice,
                    Amount: item.SellPrice,
                    SortOrder: details.length + 1,
                });

                newDetail.setAutoPrimaryKey();
                details.push(newDetail);
            }

            order.SAOrderDetails = details;
        };

        /**
         * Đảm bảo chiều rộng sidebar luôn nằm trong phạm vi cấu hình cho phép.
         * @param width Chiều rộng dự định thiết lập.
         */
        const clampSidebarWidth = (width: number) => {
            return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
        };

        /**
         * Hủy bỏ việc lắng nghe sự kiện di chuyển chuột, kết thúc tiến trình thay đổi kích thước sidebar.
         */
        const terminateSidebarResize = () => {
            isResizing.value = false;
            window.removeEventListener("mousemove", executeSidebarResize);
            window.removeEventListener("mouseup", terminateSidebarResize);
        };

        /**
         * Tính toán và gán chiều rộng mới cho sidebar dựa vào tọa độ di chuyển chuột theo trục X.
         * @param event Sự kiện chuột di chuyển (MouseEvent).
         */
        const executeSidebarResize = (event: MouseEvent) => {
            if (!isResizing.value) return;

            const nextWidth = resizeStartWidth.value - (event.clientX - resizeStartX.value);
            sidebarWidth.value = clampSidebarWidth(nextWidth);
        };

        /**
         * Kích hoạt tiến trình thay đổi kích thước sidebar khi người dùng nhấn giữ chuột vào thanh phân tách.
         * @param event Sự kiện nhấn chuột (MouseEvent).
         */
        const initiateSidebarResize = (event: MouseEvent) => {
            event.preventDefault();
            isResizing.value = true;
            resizeStartX.value = event.clientX;
            resizeStartWidth.value = sidebarWidth.value;
            window.addEventListener("mousemove", executeSidebarResize);
            window.addEventListener("mouseup", terminateSidebarResize);
        };

        // Khởi tạo đơn hàng đầu tiên khi Component được gắn kết thành công
        onMounted(() => {
            createNewOrder();
        });

        // Giải phóng các sự kiện chuột trước khi Component bị hủy bỏ khỏi DOM
        onBeforeUnmount(() => {
            terminateSidebarResize();
        });

        return {
            orders,
            currentOrder,
            tableColumns,
            isMaxTabsReached,
            isGroupRows,
            sidebarWidth,
            orderDetails,
            selectedDetailID,
            orderSummary,
            formatCurrency,
            FormatType,
            setActiveOrder,
            selectOrderDetail,
            closeOrderTab,
            createNewOrder,
            initiateSidebarResize,
            handleSelectInventoryItem,
            updateItemQuantity,
            increaseItemQuantity,
            decreaseItemQuantity,
            updateItemUnitPrice,
            updateItemAmount,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

$tab-active-bg: #f0f5ff;
$tab-height: 38px;
$radius: 10px;
$corner-size: 12px;

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
                    box-shadow: #{$corner-size / 2} #{$corner-size / 2} 0 #{$corner-size / 2} $tab-active-bg;
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
                    box-shadow: #{-$corner-size / 2} #{$corner-size / 2} 0 #{$corner-size / 2} $tab-active-bg;
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

        .main-selected-panel {
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
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
            font-weight: 600;
            font-size: 12px;
            white-space: nowrap;
        }

        .main-selected-table-wrapper {
            overflow: auto;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #ffffff;
        }

        .main-selected-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            min-width: 920px;
        }

        .main-selected-table thead th {
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
        }

        .main-selected-table thead th.is-left,
        .main-selected-table tbody td.is-left {
            text-align: left;
        }

        .main-selected-table thead th.is-right,
        .main-selected-table tbody td.is-right {
            text-align: right;
        }

        .main-selected-table tbody td {
            padding: 12px;
            border-bottom: 1px solid #eef2f7;
            vertical-align: top;
        }

        .main-selected-table tbody tr:last-child td {
            border-bottom: none;
        }

        .main-selected-table tbody tr {
            cursor: pointer;
            transition: background-color 0.15s ease;
        }

        .main-selected-table tbody tr:hover,
        .main-selected-table tbody tr.is-active {
            background-color: #eff4fe;
        }

        .main-selected-table tbody tr:hover td,
        .main-selected-table tbody tr.is-active td {
            background-color: #eff4fe;
        }

        .col-unit {
            white-space: nowrap;
            color: #374151;
            font-size: 13px;
        }

        .col-number :deep(.base-input-number-container),
        .col-number :deep(.base-input-number) {
            width: 100%;
        }

        .cell-product {
            min-width: 0;
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
            padding: 24px;
            border: 1px dashed #cbd5e1;
            border-radius: 10px;
            color: #64748b;
            text-align: center;
            background: #f8fafc;
        }

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
            padding: 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
        }

        .sidebar-footer {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
        }

        .summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            font-size: 13px;
            color: #374151;
        }
    }
}
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
</style>
