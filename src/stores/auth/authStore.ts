import { defineStore } from "pinia";
import { ref } from "vue";
import authApi from "@/api/modules/authApi";
import commonFunction from "@/commons/commonFunction";
import type { RegisterRequest, UserInfo, LoginRequest } from "@/models/auth/auth";

export const useAuthStore = defineStore("auth", () => {
    const userInfo = ref<UserInfo | null>(null);
    /**
     * ÄÄƒng nháº­p tÃ i khoáº£n.
     * @param payload - Email vÃ  máº­t kháº©u
     */
    const login = async (payload: LoginRequest) => {
        const res = await authApi.login(payload);
        userInfo.value = res.Data.UserInfo;
        commonFunction.setToken(res.Data.AccessToken);
    };

    /**
     * ÄÄƒng kÃ½ tÃ i khoáº£n má»›i.
     * @param payload - ThÃ´ng tin Ä‘Äƒng kÃ½
     */
    const register = async (payload: RegisterRequest) => {
        const res = await authApi.register(payload);
        userInfo.value = res.Data;
    };

    /**
     * ÄÄƒng xuáº¥t tÃ i khoáº£n hiá»‡n táº¡i.
     */
    const logout = async () => {
        await authApi.logout();
        commonFunction.removeToken();
        userInfo.value = null;
    };

    return { userInfo, register, logout, login };
});

