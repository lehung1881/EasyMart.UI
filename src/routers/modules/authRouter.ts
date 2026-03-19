import type { RouteRecordRaw } from "vue-router";

const authRoutes: RouteRecordRaw[] = [
    {
        path: "/register",
        name: "Register",
        component: () => import("@/pages/auth/Register.vue"),
        meta: { requiresAuth: false },
    },
    {
        path: "/login",
        name: "Login",
        component: () => import("@/pages/auth/Login.vue"),
        meta: { requiresAuth: false },
    },
];

export default authRoutes;
