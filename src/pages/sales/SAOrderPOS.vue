<template>
    <div class="saorder-pos">
        <div class="saorder-pos_header">
            <div class="tab-container">
                <div
                    v-for="order in listOrders"
                    :key="order.RefID"
                    class="tab-item"
                    :class="{ active: order.RefID === currentOrder?.RefID }"
                    @click="switchOrder(order as SAOrder)"
                >
                    <div class="tab-title">{{ order.RefNo }}</div>
                    <div @click.stop="removeOrder(order.RefID)" class="w-4 h-4 flex-center">
                        <svg width="9" height="9" viewBox="100 4 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M108.5 4.5L100.5 12.5M100.5 4.5L108.5 12.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>
                </div>

                <div class="tab-divider"></div>

                <div class="action-group">
                    <BaseButton
                        class="btn-add-order"
                        icon-right="icon-plus-primary"
                        size="sm"
                        @click="createOrder"
                        :disabled="isMaxTabsReached"
                    >
                        {{ $t("i18nSAOrder.CreateOrder") }}
                    </BaseButton>
                </div>
            </div>
        </div>

        <div class="saorder-pos_body">
            <div class="pos-content__main">
                <div class="selected-items-list">
                </div>
            </div>
            
            <div class="pos-content__sidebar">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import SAOrder from "@/models/sales/SAOrder";

export default defineComponent({
    name: "SAOrderPOS",
    setup() {
        /**
         * Danh sách các đơn hàng đang mở dưới dạng các tab
         */
        const listOrders = ref<SAOrder[]>([]);

        /**
         * Đơn hàng hiện tại đang được chọn/hiển thị
         */
        const currentOrder = ref<SAOrder | null>(null);

        /**
         * Thay đổi tab đơn hàng đang active
         * @param {SAOrder} order - Đối tượng đơn hàng được chọn
         */
        const switchOrder = (order: SAOrder) => {
            currentOrder.value = order;
        };

        /**
         * Kiểm tra số lượng tab đã đạt giới hạn tối đa (5 tab) hay chưa
         * Trả về true nếu số tab >= 5, ngược lại trả về false
         */
        const isMaxTabsReached = computed(() => {
            return listOrders.value.length >= 5;
        });

        /**
         * Đóng một tab đơn hàng dựa trên ID
         * Nếu đóng tab đang active, hệ thống sẽ tự động chuyển active sang tab đầu tiên (nếu có)
         * * @param {string} refID - ID của đơn hàng cần đóng
         */
        const removeOrder = (refID: string) => {
            const index = listOrders.value.findIndex((item) => item.RefID === refID);
            if (index === -1) {
                return;
            }
            const isCurrentOrder = currentOrder.value?.RefID === refID;
            listOrders.value.splice(index, 1);
            if (isCurrentOrder) {
                currentOrder.value = listOrders.value[0] ?? null;
            }
            // Ngầm định lại 1 đơn
            if (listOrders.value.length == 0) {
                createOrder();
            }
        };

        /**
         * Khởi tạo và thêm một đơn hàng mới vào đầu danh sách tab
         * Mã số đơn hàng (RefNo) sẽ tự động tăng dựa trên ID lớn nhất hiện tại
         */
        const createOrder = () => {
            // Tính toán hậu tố số cho tên đơn hàng tiếp theo (ví dụ: Đơn hàng 1, Đơn hàng 2,...)
            const nextId =
                listOrders.value.length > 0
                    ? Math.max(...listOrders.value.map((order) => Number(order.RefID) || 0)) + 1
                    : 1;

            const newOrder = new SAOrder({
                RefNo: `Đơn hàng ${nextId}`,
            });

            // Thiết lập khóa chính tự động cho đơn hàng
            newOrder.setAutoPrimaryKey();

            // Thêm đơn hàng mới vào đầu mảng và đặt làm tab active
            listOrders.value.unshift(newOrder);
            currentOrder.value = newOrder;
        };

        /**
         * Hook lifecycle: Tự động tạo một đơn hàng đầu tiên ngay khi component được mount thành công
         */
        onMounted(() => {
            createOrder();
        });

        return {
            listOrders,
            currentOrder,
            isMaxTabsReached,
            switchOrder,
            removeOrder,
            createOrder,
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
        gap: 12px;
        box-sizing: border-box;

        .pos-content__main {
            flex: 1;
            background-color: #ffffff;
            border-radius: 0 8px 8px 8px;
            padding: 16px;
            box-sizing: border-box;
            overflow-y: auto;
        }

        .pos-content__sidebar {
            width: 380px;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
    }
}
</style>
