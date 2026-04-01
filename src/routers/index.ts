import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import authRoutes from "./modules/authRouter";
import appRoutes from "./modules/appRouter";
import { useAuthStore } from "@/stores/auth/authStore";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        redirect: "/login",
    },
    ...authRoutes,
    ...appRoutes,
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

/**
 * Navigation guard đồng bộ với authStore (cache-first).
 *
 * Logic:
 * - Route public (requiresAuth = false):
 *   - Nếu chưa có phiên -> cho vào bình thường.
 *   - Nếu đã có phiên hợp lệ -> chuyển về Dashboard.
 * - Route cần auth:
 *   - Nếu đã có userInfo trong store -> cho qua ngay.
 *   - Nếu chưa có userInfo -> checkAuth() để khôi phục phiên từ localStorage/refresh.
 *   - Không hợp lệ -> chuyển /login.
 */
router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    const requiresAuth = to.meta.requiresAuth !== false;
    const hasUserInStore = Boolean(authStore.getUserInfo());
    const isAuthRoute = to.name === "Login" || to.name === "Register";

    if (requiresAuth) {
        if (hasUserInStore) return true;

        try {
            const isValid = await authStore.checkAuth();
            return isValid ? true : { name: "Login" };
        } catch {
            return { name: "Login" };
        }
    }

    // Tránh vào lại login/register khi đã đăng nhập.
    if (isAuthRoute) {
        if (hasUserInStore) return { name: "dashboard" };

        try {
            const isValid = await authStore.checkAuth();
            return isValid ? { name: "dashboard" } : true;
        } catch {
            return true;
        }
    }

    return true;
});

export default router;
