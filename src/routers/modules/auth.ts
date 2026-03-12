import type { RouteRecordRaw } from "vue-router";

const authRoutes: RouteRecordRaw[] = [
    {
        path: "/register",
        name: "Register",
        component: () => import("@/pages/auth/RegisterPage.vue"),
    },
    {
        path: "/login",
        name: "Login",
        component: () => import("@/pages/auth/LoginPage.vue"),
    },
];

export default authRoutes;