<template>
    <div class="saorder-pos">
        <div class="saorder-pos_tab">
            <div class="tab-container">
                <div
                    v-for="order in listOrders"
                    :key="order.id"
                    class="tab-item"
                    :class="{ active: order.id === activeTabId }"
                    @click="setActiveTab(order.id)"
                >
                    <div class="tab-title">{{ order.name }}</div>
                    <div @click.stop="closeTab(order.id)">
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
                    <BaseButton class="btn-add-order" icon-right="icon-plus-primary" size="sm" @click="createOrder">
                        Đơn mới
                    </BaseButton>
                </div>
            </div>
        </div>

        <div class="saorder-pos_content"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

interface OrderTab {
    id: number;
    name: string;
}

export default defineComponent({
    name: "SAOrderPOS",
    setup() {
        const listOrders = ref<OrderTab[]>([
            { id: 3, name: "Đơn hàng 3" },
            { id: 2, name: "Đơn hàng 2" },
            { id: 1, name: "Đơn hàng 1" },
        ]);

        const activeTabId = ref<number>(2);

        const setActiveTab = (id: number) => {
            activeTabId.value = id;
        };

        const closeTab = (id: number) => {
            const index = listOrders.value.findIndex((item) => item.id === id);
            if (index !== -1) {
                listOrders.value.splice(index, 1);
                if (activeTabId.value === id && listOrders.value.length > 0) {
                    activeTabId.value = listOrders.value[0].id;
                }
            }
        };

        const createOrder = () => {
            const nextId = listOrders.value.length > 0 ? Math.max(...listOrders.value.map((o) => o.id)) + 1 : 1;
            const newOrder: OrderTab = {
                id: nextId,
                name: `Đơn hàng ${nextId}`,
            };
            listOrders.value.unshift(newOrder);
            activeTabId.value = nextId;
        };

        return {
            listOrders,
            activeTabId,
            setActiveTab,
            closeTab,
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

    .saorder-pos_tab {
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
            margin-right: 2px;
            border-radius: $radius $radius 0 0;
            display: flex;
            align-items: center;
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
            height: 20px;
            background-color: #d1d5db;
            margin: 0 12px 10px 12px;
        }

        .action-group {
            display: flex;
            align-items: center;
            margin-bottom: 6px;
        }
    }

    .saorder-pos_content {
        height: calc(100% - 48px);
        background-color: $tab-active-bg;
        width: 100%;
    }
}
.btn-add-order {
    color: $primary-color;
    border-color: unset !important;
}
</style>
