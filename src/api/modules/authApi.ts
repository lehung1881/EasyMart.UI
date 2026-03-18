import BaseApi from "@/api/baseApi";
import type { ApiService } from "@/api/configApi";
import type { LoginResponse, LoginRequest, RegisterRequest, UserInfo } from "@/models/auth/auth";

class AuthApi extends BaseApi {
    protected readonly serviceName: ApiService = "AUTH";
    protected readonly basePath = "/v1/auth";

    /**
     * ÄÄƒng nháº­p tÃ i khoáº£n.
     * @param payload - Email vÃ  máº­t kháº©u
     */
    login(payload: LoginRequest) {
        return this.post<LoginResponse, LoginRequest>("/login", payload);
    }

    /**
     * ÄÄƒng kÃ½ tÃ i khoáº£n má»›i.
     * @param payload - ThÃ´ng tin Ä‘Äƒng kÃ½
     */
    register(payload: RegisterRequest) {
        return this.post<UserInfo, RegisterRequest>("/register", payload);
    }

    /**
     * ÄÄƒng xuáº¥t tÃ i khoáº£n hiá»‡n táº¡i.
     */
    logout() {
        return this.post<void>("/logout");
    }
}

export default new AuthApi();
