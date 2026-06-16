import { defineAsyncComponent, type App, type Plugin } from "vue";

const globalPopup: Plugin = {
    /**
     * Đăng ký các popup dùng chung theo dạng import động.
     * @param app Vue app instance dùng để đăng ký component toàn cục.
     * @returns Không trả về dữ liệu.
     */
    install(app: App) {
        app.component(
            "InventoryItemDetail",
            defineAsyncComponent(() => import("@/pages/dictionary/inventoryItem/InventoryItemDetail.vue")),
        );
        app.component(
            "StockDetail",
            defineAsyncComponent(() => import("@/pages/dictionary/stock/StockDetail.vue")),
        );
        app.component(
            "UnitDetail",
            defineAsyncComponent(() => import("@/pages/dictionary/unit/UnitDetail.vue")),
        );
        app.component(
            "SupplierDetail",
            defineAsyncComponent(() => import("@/pages/dictionary/supplier/SupplierDetail.vue")),
        );
        app.component(
            "CustomerDetail",
            defineAsyncComponent(() => import("@/pages/dictionary/customer/CustomerDetail.vue")),
        );
        app.component(
            "SAOrderDetail",
            defineAsyncComponent(() => import("@/pages/sales/SAOrderDetail.vue")),
        );
        app.component(
            "FilterPopup",
            defineAsyncComponent(() => import("@/pages/common/FilterPopup.vue")),
        );
    },
};

export default globalPopup;
