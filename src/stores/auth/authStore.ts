import { defineStore } from "pinia";
import { ref } from "vue";
import authApi from "@/api/modules/authApi";
import cacheService from "@/commons/cacheService";
import { CacheAction, CacheCode } from "@/constants/cacheConfig";
import { StoreNameConstant } from "@/constants";
import type { LoginRequest, LoginResponse, RegisterRequest, UserInfo } from "@/models/auth/auth";

export const useAuthStore = defineStore(StoreNameConstant.Auth, () => {
    const userInfo = ref<UserInfo | null>(null);

    /**
     * Lưu toàn bộ phiên đăng nhập vào store và cache.
     */
    const saveSession = (session: LoginResponse) => {
        userInfo.value = session.UserInfo;
        cacheService.set(CacheCode.AuthAccessToken, session.AccessToken);
        cacheService.set(CacheCode.AuthRefreshToken, session.RefreshToken);
        cacheService.set(CacheCode.AuthAccessTokenExpires, session.ExpiresDate);
        cacheService.set(CacheCode.AuthUserInfo, session.UserInfo);
    };

    /**
     * Xóa toàn bộ dữ liệu phiên trong store và cache.
     */
    const clearSession = () => {
        userInfo.value = null;
        cacheService.clearByAction(CacheAction.ClearOnLogout);
    };

    /**
     * Đăng nhập bằng email và mật khẩu.
     */
    const login = async (payload: LoginRequest) => {
        const res = await authApi.login(payload);
        saveSession(res.Data);
    };

    /**
     * Đăng ký tài khoản. Hàm này không tạo phiên đăng nhập.
     */
    const register = async (payload: RegisterRequest) => {
        await authApi.register(payload);
    };

    /**
     * Đăng xuất tài khoản hiện tại rồi xóa dữ liệu phiên.
     */
    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            clearSession();
        }
    };

    /**
     * Làm mới access token bằng refresh token hiện tại.
     */
    const refreshToken = async () => {
        const token = cacheService.get<string>(CacheCode.AuthRefreshToken);
        if (!token) throw new Error("Không tìm thấy refresh token.");

        const res = await authApi.refreshToken(token);
        saveSession(res.Data);
    };

    /**
     * Kiểm tra và khôi phục phiên đăng nhập từ cache khi khởi động app.
     */
    const checkAuth = async (): Promise<boolean> => {
        const token = cacheService.get<string>(CacheCode.AuthAccessToken);
        const expires = cacheService.get<string>(CacheCode.AuthAccessTokenExpires);
        const cachedUserInfo = cacheService.get<UserInfo>(CacheCode.AuthUserInfo);

        if (!token || !expires || !cachedUserInfo) return false;

        if (new Date() >= new Date(expires)) {
            try {
                await refreshToken();
                return true;
            } catch {
                clearSession();
                return false;
            }
        }

        userInfo.value = cachedUserInfo;
        return true;
    };

    /**
     * Lấy thông tin người dùng hiện tại từ store.
     */
    const getUserInfo = (): UserInfo | null => userInfo.value;

    return { userInfo, login, register, logout, refreshToken, checkAuth, getUserInfo };
});
