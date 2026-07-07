import type { RouteRecordRaw } from "vue-router";

const salesRoutes: RouteRecordRaw[] = [
    {
        path: "sales/orders",
        name: "sales",
        component: () => import("@/pages/sales/saleOrder/SAOrderList.vue"),
    },
];

export default salesRoutes;
