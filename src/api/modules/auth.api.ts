import BaseApi from "@/api/base.api";
import type { ApiService } from "@/api/config.api";
import type { LoginResponse, LoginRequest, RegisterRequest, UserInfo } from "@/models/auth/auth.model";

class AuthApi extends BaseApi {
    protected readonly serviceName: ApiService = "AUTH";
    protected readonly basePath = "/v1/auth";

    /**
     * Đăng nhập tài khoản.
     * @param payload - Email và mật khẩu
     */
    login(payload: LoginRequest) {
        return this.post<LoginResponse, LoginRequest>("/login", payload);
    }

    /**
     * Đăng ký tài khoản mới.
     * @param payload - Thông tin đăng ký
     */
    register(payload: RegisterRequest) {
        return this.post<UserInfo, RegisterRequest>("/register", payload);
    }

    /**
     * Đăng xuất tài khoản hiện tại.
     */
    logout() {
        return this.post<void>("/logout");
    }
}

export default new AuthApi();