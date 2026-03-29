import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import type { ServiceResponse } from "@/models/common/serviceResponse";
import type { PagingRequest, PagingResponse } from "@/models/common/paging";
import { API_CONFIG } from "@/api/configApi";
import type { ApiService } from "@/api/configApi";
import cacheService from "@/commons/cacheService";
import { CacheCode } from "@/constants/cacheConfig";

abstract class BaseAPI {
    protected abstract readonly serviceName: ApiService;
    protected abstract readonly basePath: string;

    private _instance: AxiosInstance | null = null;

    /**
     * Kh?i t?o axios instance theo t?ng service (lazy init).
     * Instance ch? du?c t?o m?t l?n khi l?n d?u tiên g?i API.
     */
    protected get instance(): AxiosInstance {
        if (!this._instance) {
            this._instance = axios.create({
                baseURL: API_CONFIG[this.serviceName],
            });
            this.initRequestInterceptor();
            this.initResponseInterceptor();
        }
        return this._instance;
    }

    /**
     * Ghép basePath và url thành du?ng d?n d?y d?.
     * @param url - Path c?a endpoint, ví d?: /login
     * @returns Ðu?ng d?n d?y d?, ví d?: /v1/auth/login
     */
    private buildUrl(url: string): string {
        return `${this.basePath}${url}`;
    }

    /**
     * Interceptor x? lý request tru?c khi g?i lên server.
     * Ð?c Access Token t? localStorage và g?n vào Authorization header.
     * Ðính kèm các thông tin d?nh danh ngu?i dùng vào header n?u có:
     * - Authorization: Bearer token
     * - X-UserID: ID ngu?i dùng
     * - X-DatabaseID: ID database c?a tenant
     * - X-TenantID: ID tenant
     * - X-FullName: H? tên ngu?i dùng (encoded UTF-8)
     */
    private initRequestInterceptor() {
        this._instance!.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                const { useAuthStore } = await import("@/stores/auth/authStore");
                const userInfo = useAuthStore().getUserInfo();
                const token = cacheService.get<string>(CacheCode.AuthAccessToken);

                if (token) config.headers.set("Authorization", `Bearer ${token}`);
                if (userInfo) {
                    config.headers.set("X-UserID", userInfo.UserID);
                    config.headers.set("X-DatabaseID", userInfo.DatabaseID);
                    config.headers.set("X-TenantID", userInfo.TenantID);
                    config.headers.set("X-FullName", encodeURIComponent(userInfo.FullName));
                }

                return config;
            },
            (error: unknown) => Promise.reject(error),
        );
    }

    /**
     * Interceptor x? lý response tr? v? t? server.
     * - T? d?ng reject n?u Success === false.
     * - Khi nh?n 401 (Access Token h?t h?n), t? d?ng g?i /refresh_token m?t l?n.
     *   N?u refresh thành công, luu token m?i vào localStorage và retry request g?c.
     *   N?u refresh th?t b?i, xóa token và thông tin ngu?i dùng r?i chuy?n v? trang login.
     */
    private initResponseInterceptor() {
        this._instance!.interceptors.response.use(
            (res) => {
                if (res.data?.Success === false) return Promise.reject(res.data);
                return res.data;
            },
            async (error: unknown) => {
                const axiosError = error as {
                    config?: InternalAxiosRequestConfig & { _retry?: boolean };
                    response?: { status: number };
                };
                const status = axiosError.response?.status;
                const config = axiosError.config;

                if (status === 401 && config && !config._retry) {
                    config._retry = true;
                    try {
                        // G?i refresh token — luu token m?i vào localStorage
                        const { useAuthStore } = await import("@/stores/auth/authStore");
                        await useAuthStore().refreshToken();

                        // G?n l?i Access Token m?i vào header r?i retry request g?c
                        const newToken = cacheService.get<string>(CacheCode.AuthAccessToken);
                        if (newToken) config.headers.set("Authorization", `Bearer ${newToken}`);

                        return this.instance(config);
                    } catch {
                        // Refresh th?t b?i ? phiên h?t h?n hoàn toàn, v? trang login
                        const { useAuthStore } = await import("@/stores/auth/authStore");
                        await useAuthStore().logout();
                        window.location.href = "/login";
                    }
                }

                return Promise.reject(error);
            },
        );
    }

    /**
     * L?y ra URL d?y d? c?a service hi?n t?i.
     * @returns URL d?y d?, ví d?: http://localhost:3001/v1/auth
     */
    public getServiceUrl(): string {
        return `${API_CONFIG[this.serviceName]}${this.basePath}`;
    }

    /**
     * G?i HTTP GET request.
     * @param url - Path c?a endpoint, ví d?: /profile
     * @param config - C?u hình axios tùy ch?n
     */
    public get<T>(url: string, config?: AxiosRequestConfig) {
        return this.instance.get<T, ServiceResponse<T>>(this.buildUrl(url), config);
    }

    /**
     * G?i HTTP POST request.
     * @param url - Path c?a endpoint, ví d?: /login
     * @param payload - D? li?u g?i lên server
     * @param config - C?u hình axios tùy ch?n
     */
    public post<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.post<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * G?i HTTP PUT request.
     * @param url - Path c?a endpoint, ví d?: /profile
     * @param payload - D? li?u c?p nh?t
     * @param config - C?u hình axios tùy ch?n
     */
    public put<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.put<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * G?i HTTP PATCH request.
     * @param url - Path c?a endpoint, ví d?: /profile/avatar
     * @param payload - D? li?u c?p nh?t m?t ph?n
     * @param config - C?u hình axios tùy ch?n
     */
    public patch<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.patch<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * G?i HTTP DELETE request.
     * @param url - Path c?a endpoint, ví d?: /profile
     * @param config - C?u hình axios tùy ch?n
     */
    public delete<T>(url: string, config?: AxiosRequestConfig) {
        return this.instance.delete<T, ServiceResponse<T>>(this.buildUrl(url), config);
    }

    /**
     * Thêm/s?a/xóa b?n ghi.
     * @param payload - D? li?u c?a b?n ghi c?n thêm/s?a/xóa
     */
    public saveData<T>(payload: T) {
        return this.post<T>("/save_data_async", payload);
    }

    /**
     * Lây dữ liệu phân trang và tìm kiếm.
     * @param payload
     * @returns
     */
    public getPagingData(payload: PagingRequest) {
        return this.post<PagingResponse, PagingRequest>("/paging_filter", payload);
    }
}

export default BaseAPI;
