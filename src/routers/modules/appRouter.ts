import type { RouteRecordRaw } from "vue-router";
import dictionaryRoutes from "./dictionaryRouter";
import reportRoutes from "./reportRouter";

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
                name: "dashboard",
                component: () => import("@/pages/dashboard/Dashboard.vue"),
            },
            ...dictionaryRoutes,
            ...reportRoutes,
        ],
    },
];

export default appRoutes;
