import { ref, computed, type Ref } from "vue";
import SAOrder from "@/models/sales/SAOrder";

const MAX_TABS = 5;

/**
 * lvhung - 05.07.2026
 * Quản lý vòng đời danh sách tab đơn hàng trong màn hình POS:
 * tạo mới, đóng tab, chuyển tab active, kiểm tra giới hạn tối đa.
 */
export function useOrderTabManager() {
    // ── STATE ────────────────────────────────────────────────────────────

    const orderList = ref<SAOrder[]>([]);
    const activeOrder = ref<SAOrder | null>(null) as Ref<SAOrder | null>;

    // ── COMPUTED ─────────────────────────────────────────────────────────

    /**
     * lvhung - 05.07.2026
     * Kiểm tra đã đạt giới hạn tối đa số tab đơn hàng được mở đồng thời.
     */
    const isMaxTabsReached = computed(() => orderList.value.length >= MAX_TABS);

    // ── ACTIONS ──────────────────────────────────────────────────────────

    /**
     * lvhung - 05.07.2026
     * Tạo mới một đơn hàng, sinh mã đơn tạm thời tăng dần và kích hoạt tab vừa tạo.
     */
    function createNewOrder(): void {
        const nextCount = orderList.value.length + 1;

        const newOrder = new SAOrder({
            RefNoText: `Đơn hàng ${nextCount}`,
            SAOrderDetails: [],
        });

        newOrder.setAutoPrimaryKey();
        orderList.value.push(newOrder);
        activeOrder.value = newOrder;
    }

    /**
     * lvhung - 05.07.2026
     * Chuyển tab hiển thị sang đơn hàng được chỉ định và reset detail đang chọn.
     * @param order Đối tượng đơn hàng cần kích hoạt.
     */
    function setActiveOrder(order: SAOrder): void {
        activeOrder.value = order;
    }

    /**
     * lvhung - 05.07.2026
     * Đóng một tab đơn hàng. Nếu đóng tab đang active thì tự động kích hoạt tab
     * kề cạnh. Nếu không còn tab nào thì tạo mới một đơn hàng trống.
     * @param refID ID của đơn hàng cần đóng tab.
     */
    function closeOrderTab(refID: string): void {
        const tabIndex = orderList.value.findIndex((order) => order.RefID === refID);
        if (tabIndex === -1) return;

        const isClosingActiveOrder = activeOrder.value?.RefID === refID;
        orderList.value.splice(tabIndex, 1);

        if (isClosingActiveOrder) {
            activeOrder.value = (orderList.value[0] as SAOrder) ?? null;
        }

        if (orderList.value.length === 0) {
            createNewOrder();
        }
    }

    return {
        orderList,
        activeOrder,
        isMaxTabsReached,
        createNewOrder,
        setActiveOrder,
        closeOrderTab,
    };
}
