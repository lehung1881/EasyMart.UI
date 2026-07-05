import { ref, computed, type Ref } from "vue";
import SAOrder from "@/models/sales/SAOrder";

const MAX_TABS = 5;

// Định nghĩa Interface chứa SAOrder và các metadata của tab
export interface OrderTab {
    tabID: string;
    title: string;
    discountType: string;
    discountValue: number;
    order: SAOrder;
}

/**
 * lvhung - 05.07.2026
 * Quản lý vòng đời danh sách tab đơn hàng trong màn hình POS:
 * tạo mới, đóng tab, chuyển tab active, kiểm tra giới hạn tối đa.
 */
export function useOrderTabManager() {
    // #region State
    const orderList = ref<OrderTab[]>([]);
    const activeTab = ref<OrderTab>({
        tabID: "",
        title: "",
        discountType: "percent",
        discountValue: 0,
        order: new SAOrder(),
    }) as Ref<OrderTab>;
    // #endregion

    // #region Computed
    /**
     * lvhung - 05.07.2026
     * Kiểm tra đã đạt giới hạn tối đa số tab đơn hàng được mở đồng thời.
     */
    const isMaxTabsReached = computed(() => orderList.value.length >= MAX_TABS);

    /**
     * Trả về trực tiếp SAOrder của tab đang active để dễ dàng bind 2 chiều (v-model)
     * trên template mà không cần đổi thành activeTab.order.CustomerName
     */
    const activeOrder = computed(() => activeTab.value?.order ?? null);
    // #endregion

    // #region Actions
    /**
     * lvhung - 05.07.2026
     * Tạo mới một đơn hàng, sinh mã đơn tạm thời tăng dần và kích hoạt tab vừa tạo.
     */
    const createNewOrder = (): void => {
        const nextCount = orderList.value.length + 1;
        const refNoText = `Đơn hàng ${nextCount}`;

        const newOrder = new SAOrder({
            RefNoText: refNoText,
            SAOrderDetails: [],
        });

        newOrder.setAutoPrimaryKey();

        const newTab: OrderTab = {
            tabID: newOrder.RefID,
            title: refNoText,
            discountType: "percent",
            discountValue: 0,
            order: newOrder,
        };

        orderList.value.push(newTab);
        activeTab.value = newTab;
    };

    /**
     * lvhung - 05.07.2026
     * Chuyển tab hiển thị sang đơn hàng được chỉ định.
     * @param tab Đối tượng tab cần kích hoạt.
     */
    const setActiveTab = (tab: OrderTab): void => {
        activeTab.value = tab;
    };

    /**
     * lvhung - 05.07.2026
     * Đóng một tab đơn hàng. Nếu đóng tab đang active thì tự động kích hoạt tab
     * kề cạnh. Nếu không còn tab nào thì tạo mới một đơn hàng trống.
     * @param refID ID của đơn hàng cần đóng tab.
     */
    const closeOrderTab = (refID: string): void => {
        const tabIndex = orderList.value.findIndex((tab) => tab.order.RefID === refID);
        if (tabIndex === -1) return;

        const isClosingActiveTab = activeTab.value?.order.RefID === refID;
        orderList.value.splice(tabIndex, 1);

        if (isClosingActiveTab) {
            activeTab.value = (orderList.value[0] as OrderTab) ?? null;
        }

        if (orderList.value.length === 0) {
            createNewOrder();
        }
    };
    // #endregion

    return {
        orderList,
        activeTab,
        activeOrder,
        isMaxTabsReached,
        createNewOrder,
        setActiveTab,
        closeOrderTab,
    };
}
