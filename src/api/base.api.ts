import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import commonFunction from "@/commons/commonFunction";
import type { ServiceResponse } from "@/api/models/serviceResponse.type";
import { API_CONFIG } from "@/api/config.api";
import type { ApiService } from "@/api/config.api";

abstract class BaseApi {
    protected abstract readonly serviceName: ApiService;
    protected abstract readonly basePath: string;

    private _instance: AxiosInstance | null = null;

    /**
     * Khởi tạo axios instance theo từng service (lazy init).
     * Instance chỉ được tạo một lần khi lần đầu tiên gọi API.
     */
    protected get instance(): AxiosInstance {
        if (!this._instance) {
            this._instance = axios.create({
                baseURL: API_CONFIG[this.serviceName],
                // timeout: 600000,
            });
            this.initRequestInterceptor();
            this.initResponseInterceptor();
        }
        return this._instance;
    }

    /**
     * Ghép basePath và url thành đường dẫn đầy đủ.
     * @param url - Path của endpoint, ví dụ: /login
     * @returns Đường dẫn đầy đủ, ví dụ: /auth/login
     */
    private buildUrl(url: string): string {
        return `${this.basePath}${url}`;
    }

    /**
     * Interceptor xử lý request trước khi gửi lên server.
     * Tự động đính kèm token và userID vào header nếu có.
     */
    private initRequestInterceptor() {
        this._instance!.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = commonFunction.getToken();
                const userID = commonFunction.getUserID();

                if (token) config.headers.set("Authorization", `Bearer ${token}`);
                if (userID) config.headers.set("X-UserID", userID);

                return config;
            },
            (error: unknown) => Promise.reject(error)
        );
    }

    /**
     * Interceptor xử lý response trả về từ server.
     * Tự động reject nếu Success === false.
     */
    private initResponseInterceptor() {
        this._instance!.interceptors.response.use(
            (res) => {
                if (res.data?.Success === false) return Promise.reject(res.data);
                return res.data;
            },
            (error: unknown) => Promise.reject(error)
        );
    }

    /**
     * Lấy ra URL đầy đủ của service hiện tại.
     * @returns URL đầy đủ, ví dụ: http://localhost:3001/v1/auth
     */
    public getServiceUrl(): string {
        return `${API_CONFIG[this.serviceName]}${this.basePath}`;
    }

    /**
     * Gửi HTTP GET request.
     * @param url - Path của endpoint, ví dụ: /profile
     * @param config - Cấu hình axios tùy chọn
     */
    protected get<T>(url: string, config?: AxiosRequestConfig) {
        return this.instance.get<T, ServiceResponse<T>>(this.buildUrl(url), config);
    }

    /**
     * Gửi HTTP POST request.
     * @param url - Path của endpoint, ví dụ: /login
     * @param payload - Dữ liệu gửi lên server
     * @param config - Cấu hình axios tùy chọn
     */
    protected post<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.post<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * Gửi HTTP PUT request.
     * @param url - Path của endpoint, ví dụ: /profile
     * @param payload - Dữ liệu cập nhật
     * @param config - Cấu hình axios tùy chọn
     */
    protected put<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.put<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * Gửi HTTP PATCH request.
     * @param url - Path của endpoint, ví dụ: /profile/avatar
     * @param payload - Dữ liệu cập nhật một phần
     * @param config - Cấu hình axios tùy chọn
     */
    protected patch<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.patch<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * Gửi HTTP DELETE request.
     * @param url - Path của endpoint, ví dụ: /profile
     * @param config - Cấu hình axios tùy chọn
     */
    protected delete<T>(url: string, config?: AxiosRequestConfig) {
        return this.instance.delete<T, ServiceResponse<T>>(this.buildUrl(url), config);
    }

    /**
     * Thêm/sửa/xóa bản ghi.
     * @param payload - Dữ liệu của bản ghi cần thêm/sửa/xóa
     */
    protected saveData<T>(payload: T) {
        return this.post<T>("/save_data_async", payload);
    }
}

export default BaseApi;