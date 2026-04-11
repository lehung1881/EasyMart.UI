import type { RouteRecordRaw } from "vue-router";

const dictionaryRoutes: RouteRecordRaw[] = [
    {
        path: "dictionary/inventory-items",
        name: "inventory-items",
        component: () => import("@/pages/dictionary/inventoryItem/InventoryItemList.vue"),
    },
    {
        path: "dictionary/stocks",
        name: "stocks",
        component: () => import("@/pages/dictionary/stock/StockList.vue"),
    },
    {
        path: "dictionary/units",
        name: "units",
        component: () => import("@/pages/dictionary/unit/UnitList.vue"),
    },
];

export default dictionaryRoutes;
