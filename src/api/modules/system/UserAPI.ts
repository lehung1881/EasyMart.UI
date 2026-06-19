import BaseAPI from "@/api/baseAPI";

class UserAPI extends BaseAPI {
    protected readonly serviceName = "BUSINESS" as const;
    protected readonly basePath = "v1/user";

    /**
     * Lấy danh sách quyền của người dùng đăng nhập hiện tại.
     * Endpoint Backend: GET [BUSINESS_SERVICE_URL]/v1/user/permissions
     * @returns Danh sách các đối tượng mapping quyền của User.
     */
    getUserPermissions() {
        // Sử dụng phương thức get với Generic để định nghĩa kiểu trả về là mảng any[] 
        // (hoặc thay 'any[]' bằng Model cụ thể nếu dự án có file SysMscPermissionMapping.ts)
        return this.get<any[]>(`/permissions`);
    }
}

export default new UserAPI();
