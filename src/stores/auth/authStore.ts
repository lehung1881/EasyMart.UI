import { defineStore } from "pinia";
import { ref } from "vue";
import authAPI from "@/api/modules/auth/authAPI";
import userAPI from "@/api/modules/system/userAPI"; // Import thêm userAPI chứa hàm lấy quyền vừa viết
import cacheService from "@/commons/cacheService";
import { CacheAction, CacheCode } from "@/constants/staticConfig/cacheConfig";
import { StoreNameConstant } from "@/constants";
import type { LoginRequest, LoginResponse, RegisterRequest, UserInfo } from "@/models/auth/auth";

// Định nghĩa Interface cấu trúc trả về từ Backend để gõ code chuẩn TypeScript
export interface SysMscPermissionMapping {
    SubSystemCode: string;
    ListPermission: string; // Chuỗi JSON nhận từ C#: "{\"Add\": true, \"Use\": true...}"
}

// Kiểu dữ liệu sau khi đã được Parse JSON để lưu vào State nhằm tối ưu hóa tốc độ tìm kiếm
export interface ParsedPermissions {
    [subSystemCode: string]: {
        [action: string]: boolean;
    };
}

export const useAuthStore = defineStore(StoreNameConstant.Auth, () => {
    const userInfo = ref<UserInfo | null>(null);
    
    // State lưu trữ bản đồ phân quyền đã được chuẩn hóa
    const permissionMap = ref<ParsedPermissions>({});
    
    // Trạng thái đang tải quyền để block UI nếu cần
    const loadingPermissions = ref<boolean>(false);

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
        permissionMap.value = {}; // Reset sạch quyền khi đóng phiên làm việc
        cacheService.clearByAction(CacheAction.ClearOnLogout);
    };

    /**
     * Đăng nhập bằng email và mật khẩu.
     */
    const login = async (payload: LoginRequest) => {
        const res = await authAPI.login(payload);
        saveSession(res.Data);
        // Đăng nhập xong tự động kéo quyền về luôn
        await fetchUserPermissions();
    };

    /**
     * Đăng ký tài khoản. Hàm này không tạo phiên đăng nhập.
     */
    const register = async (payload: RegisterRequest) => {
        await authAPI.register(payload);
    };

    /**
     * Đăng xuất tài khoản hiện tại rồi xóa dữ liệu phiên.
     */
    const logout = async () => {
        try {
            await authAPI.logout();
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

        const res = await authAPI.refreshToken(token);
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
                await fetchUserPermissions(); // Khôi phục quyền sau khi refresh token thành công
                return true;
            } catch {
                clearSession();
                return false;
            }
        }

        userInfo.value = cachedUserInfo;
        await fetchUserPermissions(); // Khôi phục quyền từ API khi reload trang f5
        return true;
    };

    /**
     * Lấy thông tin người dùng hiện tại từ store.
     */
    const getUserInfo = (): UserInfo | null => userInfo.value;

    /* =========================================================================
     * BỔ SUNG: LOGIC XỬ LÝ PHÂN QUYỀN (PERMISSIONS)
     * ========================================================================= */

    /**
     * Gọi API lấy danh sách quyền của người dùng hiện tại và thực hiện chuẩn hóa dữ liệu.
     */
    const fetchUserPermissions = async () => {
        // Tránh gọi trùng lặp nếu map quyền đã được nạp trước đó
        if (Object.keys(permissionMap.value).length > 0) return;

        try {
            loadingPermissions.value = true;
            const res = await userAPI.getUserPermissions();

            const tempMap: ParsedPermissions = {};

            if (res && Array.isArray(res)) {
                res.forEach((item: SysMscPermissionMapping) => {
                    if (item.SubSystemCode && item.ListPermission) {
                        try {
                            // Parse chuỗi JSON thành object Javascript
                            tempMap[item.SubSystemCode] = JSON.parse(item.ListPermission);
                        } catch (parseError) {
                            console.error(`Lỗi định dạng JSON ListPermission tại màn hình ${item.SubSystemCode}:`, parseError);
                            tempMap[item.SubSystemCode] = {};
                        }
                    }
                });
            }
            
            permissionMap.value = tempMap;
        } catch (error) {
            console.error("Lỗi xảy ra trong quá trình nạp quyền người dùng:", error);
            permissionMap.value = {};
        } finally {
            loadingPermissions.value = false;
        }
    };

    /**
     * Hàm kiểm tra xem người dùng có quyền thực hiện hành động tại một màn hình cụ thể hay không.
     * @param subSystem Mã chức năng / màn hình (Ví dụ: "Customer", "Product")
     * @param action Hành động cần kiểm tra (Ví dụ: "Add", "Edit", "Delete", "ExportData")
     * @returns boolean - true nếu được phép, false nếu bị chặn quyền
     */
    const checkPermission = (subSystem: string, action: string): boolean => {
        const subSystemPermissions = permissionMap.value[subSystem];
        
        if (!subSystemPermissions) return false; // Không tìm thấy màn hình này tức là không có quyền truy cập

        // Nếu tài khoản có quyền tối cao "Full", mặc định cho phép vượt qua mọi action kiểm tra lẻ
        if (subSystemPermissions["Full"] === true) return true;

        // Trả về đúng trạng thái boolean của hành động đó trong JSON (đảm bảo ép kiểu chuẩn bằng !!)
        return !!subSystemPermissions[action];
    };

    return { 
        userInfo, 
        permissionMap,
        loadingPermissions,
        login, 
        register, 
        logout, 
        refreshToken, 
        checkAuth, 
        getUserInfo,
        fetchUserPermissions,
        checkPermission // Xuất hàm check quyền ra ngoài để sử dụng
    };
});