import type { RouteRecordRaw } from "vue-router";

const dictionaryRoutes: RouteRecordRaw[] = [
    {
        path: "dictionary/inventory-item",
        name: "InventoryItemList",
        component: () => import("@/pages/dictionary/inventoryItem/InventoryItemList.vue"),
    },
    {
        path: "dictionary/stock",
        name: "StockList",
        component: () => import("@/pages/dictionary/stock/StockList.vue"),
    },
    {
        path: "dictionary/unit",
        name: "UnitList",
        component: () => import("@/pages/dictionary/unit/UnitList.vue"),
    },
    {
        path: "dictionary/supplier",
        name: "SupplierList",
        component: () => import("@/pages/dictionary/supplier/SupplierList.vue"),
    },
    {
        path: "dictionary/customer",
        name: "CustomerList",
        component: () => import("@/pages/dictionary/customer/CustomerList.vue"),
    },
];

export default dictionaryRoutes;
