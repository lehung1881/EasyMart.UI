import BaseApi from "@/api/baseApi";
import type { ApiService } from "@/api/configApi";
import type { LoginRequest, LoginResponse, RegisterRequest, UserInfo } from "@/models/auth/auth";

class AuthApi extends BaseApi {
    protected readonly serviceName: ApiService = "AUTH";
    protected readonly basePath = "/v1/auth";

    /**
     * Đăng nhập tài khoản.
     * Server trả về AccessToken, RefreshToken và UserInfo trong body response.
     * @param payload - Email và mật khẩu
     * @returns LoginResponse chứa AccessToken, RefreshToken và UserInfo.
     */
    login(payload: LoginRequest) {
        return this.post<LoginResponse, LoginRequest>("/login", payload);
    }

    /**
     * Đăng ký tài khoản mới.
     * @param payload - Thông tin đăng ký
     * @returns UserInfo của tài khoản vừa tạo.
     */
    register(payload: RegisterRequest) {
        return this.post<UserInfo, RegisterRequest>("/register", payload);
    }

    /**
     * Đăng xuất tài khoản hiện tại.
     * Client tự xóa token khỏi localStorage sau khi gọi hàm này.
     */
    logout() {
        return this.post<void>("/logout");
    }

    /**
     * Làm mới Access Token bằng Refresh Token hiện có trong localStorage.
     * Áp dụng Token Rotation: server thu hồi Refresh Token cũ và cấp cặp token mới.
     * @param refreshToken - Refresh Token hiện tại lấy từ localStorage.
     * @returns LoginResponse chứa AccessToken mới, RefreshToken mới và UserInfo.
     */
    refreshToken(refreshToken: string) {
        return this.post<LoginResponse>("/refresh_token", { RefreshToken: refreshToken });
    }

    /**
     * Kiểm tra phiên đăng nhập hiện tại còn hợp lệ không.
     * Gửi Access Token qua Authorization header — server xác thực và trả về UserInfo.
     * Được gọi mỗi khi app khởi động (F5, mở tab mới) để khôi phục trạng thái đăng nhập.
     * @returns UserInfo nếu token còn hạn, throw error nếu hết hạn.
     */
    me() {
        return this.get<UserInfo>("/me");
    }
}

export default new AuthApi();
