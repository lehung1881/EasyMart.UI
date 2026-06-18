import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import type { ServiceResponse } from "@/models/common/serviceResponse";
import type { PagingRequest, PagingResponse } from "@/models/common/paging";
import { API_CONFIG } from "@/api/configApi";
import type { ApiService } from "@/api/configApi";
import cacheService from "@/commons/cacheService";
import { CacheCode } from "@/constants/staticConfig/cacheConfig";

abstract class BaseAPI {
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
            });
            this.initRequestInterceptor();
            this.initResponseInterceptor();
        }
        return this._instance;
    }

    /**
     * Ghép basePath và url thành đường dẫn đầy đủ.
     * @param url - Path của endpoint, ví dụ: /login
     * @returns Đường dẫn đầy đủ, ví dụ: /v1/auth/login
     */
    private buildUrl(url: string): string {
        return `${this.basePath}${url}`;
    }

    /**
     * Interceptor xử lý request trước khi gửi lên server.
     * Đọc Access Token từ localStorage và gắn vào Authorization header.
     * Đính kèm các thông tin định danh người dùng vào header nếu có:
     * - Authorization: Bearer token
     * - X-UserID: ID người dùng
     * - X-EasyMartID: ID EasyMart
     * - X-FullName: Họ tên người dùng (encoded UTF-8)
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
                    config.headers.set("X-EasyMartID", userInfo.EasyMartID);
                    config.headers.set("X-FullName", encodeURIComponent(userInfo.FullName));
                }

                return config;
            },
            (error: unknown) => Promise.reject(error),
        );
    }

    /**
     * Interceptor xử lý response trả về từ server.
     * - Tự động reject nếu Success === false.
     * - Khi nhận 401 (Access Token hết hạn), tự động gọi /refresh_token một lần.
     * Nếu refresh thành công, lưu token mới vào localStorage và retry request gốc.
     * Nếu refresh thất bại, xóa token và thông tin người dùng rồi chuyển về trang login.
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
                        // Gọi refresh token — lưu token mới vào localStorage
                        const { useAuthStore } = await import("@/stores/auth/authStore");
                        await useAuthStore().refreshToken();

                        // Gắn lại Access Token mới vào header rồi retry request gốc
                        const newToken = cacheService.get<string>(CacheCode.AuthAccessToken);
                        if (newToken) config.headers.set("Authorization", `Bearer ${newToken}`);

                        return this.instance(config);
                    } catch {
                        // Refresh thất bại hoặc phiên hết hạn hoàn toàn, về trang login
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
    public get<T>(url: string, config?: AxiosRequestConfig) {
        return this.instance.get<T, ServiceResponse<T>>(this.buildUrl(url), config);
    }

    /**
     * Gửi HTTP POST request.
     * @param url - Path của endpoint, ví dụ: /login
     * @param payload - Dữ liệu gửi lên server
     * @param config - Cấu hình axios tùy chọn
     */
    public post<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.post<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * Gửi HTTP PUT request.
     * @param url - Path của endpoint, ví dụ: /profile
     * @param payload - Dữ liệu cập nhật
     * @param config - Cấu hình axios tùy chọn
     */
    public put<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.put<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * Gửi HTTP PATCH request.
     * @param url - Path của endpoint, ví dụ: /profile/avatar
     * @param payload - Dữ liệu cập nhật một phần
     * @param config - Cấu hình axios tùy chọn
     */
    public patch<T, P = unknown>(url: string, payload?: P, config?: AxiosRequestConfig) {
        return this.instance.patch<T, ServiceResponse<T>>(this.buildUrl(url), payload, config);
    }

    /**
     * Thêm/sửa/xóa bản ghi.
     * @param payload - Dữ liệu của bản ghi cần thêm/sửa/xóa
     */
    public saveData<T>(payload: T) {
        return this.post<T>("/save_data_async", payload);
    }

    /**
     * Thêm/sửa/xóa nhiều bản ghi.
     * @param items - Danh sách bản ghi cần xử lý
     */
    public saveListData<T>(items: T[]) {
        return this.post<T[]>("/save_list_data_async", items);
    }

    /**
     * Cập nhật trạng thái (active/inactive) cho một hoặc nhiều bản ghi.
     * @param ids - Danh sách ID của bản ghi cần cập nhật trạng thái
     * @param status - Trạng thái mới (ví dụ: 1 cho active, 2 cho inactive)
     */
    public updateStatus(ids: any[], status: number) {
        return this.post<ServiceResponse>(`/update_status/${status}`, ids);
    }

    /**
     * Lấy dữ liệu phân trang và tìm kiếm.
     * @param payload
     */
    public getPagingData(payload: PagingRequest) {
        return this.post<PagingResponse, PagingRequest>("/paging_filter", payload);
    }

    /**
     * Lấy dữ liệu phân trang và tìm kiếm cho combobox.
     * @param payload
     */
    public getPagingCombobox(payload: PagingRequest) {
        return this.post<PagingResponse, PagingRequest>("/paging_combobox", payload);
    }

    /**
     * Lấy dữ liệu bản ghi theo ID.
     * @param id
     */
    public getByID<T>(id: string) {
        return this.get<ServiceResponse<T>>(`/get_by_id/${id}`);
    }

    /**
     * Lấy dữ liệu danh sách chi tiết (Master-Detail) theo ID.
     * @param id
     */
    public getMasterDetail<T>(id: string) {
        return this.get<T>(`/master_detail/${id}`);
    }
}

export default BaseAPI;