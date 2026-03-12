import { defineStore } from "pinia";
import { ref } from "vue";
import authApi from "@/api/modules/auth.api";
import commonFunction from "@/commons/commonFunction";
import type { RegisterRequest, UserInfo, LoginRequest } from "@/models/auth/auth.model";

export const useAuthStore = defineStore("auth", () => {
    const userInfo = ref<UserInfo | null>(null);
    /**
     * Đăng nhập tài khoản.
     * @param payload - Email và mật khẩu
     */
    const login = async (payload: LoginRequest) => {
        const res = await authApi.login(payload);
        userInfo.value = res.Data.UserInfo;
        commonFunction.setToken(res.Data.AccessToken);
    };

    /**
     * Đăng ký tài khoản mới.
     * @param payload - Thông tin đăng ký
     */
    const register = async (payload: RegisterRequest) => {
        const res = await authApi.register(payload);
        userInfo.value = res.Data;
    };

    /**
     * Đăng xuất tài khoản hiện tại.
     */
    const logout = async () => {
        await authApi.logout();
        commonFunction.removeToken();
        userInfo.value = null;
    };

    return { userInfo, register, logout, login };
});
