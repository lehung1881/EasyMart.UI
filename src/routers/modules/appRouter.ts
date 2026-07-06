import type { RouteRecordRaw } from "vue-router";
import dictionaryRoutes from "./dictionaryRouter";
import salesRoutes from "./salesRouter";
import reportRoutes from "./reportRouter";
import systemRoutes from "./systemRouter";

const appRoutes: RouteRecordRaw[] = [
    {
        path: "/app",
        component: () => import("@/layout/MainLayout.vue"),
        children: [
            {
                path: "",
                redirect: { name: "Dashboard" },
            },
            {
                path: "dashboard",
                name: "Dashboard",
                component: () => import("@/pages/dashboard/Dashboard.vue"),
            },
            {
                path: "sale/saorder-pos",
                name: "SAOrderPOS",
                component: () => import("@/pages/sales/saleOrderPos/SAOrderPOS.vue"),
            },

            ...dictionaryRoutes,
            ...salesRoutes,
            ...systemRoutes,
        ],
    },
];

export default appRoutes;
