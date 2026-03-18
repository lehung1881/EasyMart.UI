import type { RouteRecordRaw } from "vue-router";

const authRoutes: RouteRecordRaw[] = [
    {
        path: "/register",
        name: "Register",
        component: () => import("@/pages/auth/Register.vue"),
    },
    {
        path: "/login",
        name: "Login",
        component: () => import("@/pages/auth/Login.vue"),
    },
];

export default authRoutes;
