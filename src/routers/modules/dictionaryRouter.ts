import type { RouteRecordRaw } from "vue-router";

const dictionaryRoutes: RouteRecordRaw[] = [
    {
        path: "dictionary/inventory-items",
        name: "inventory-items",
        component: () => import("@/pages/dictionary/inventoryItem/InventoryItemList.vue"),
    },
];

export default dictionaryRoutes;
