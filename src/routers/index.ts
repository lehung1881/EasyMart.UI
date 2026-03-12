import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import authRoutes from "./modules/auth";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        redirect: "/login",
    },
    ...authRoutes,
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

export default router;