export interface UserInfo {
    /** Định danh duy nhất của User */
    UserID: string;
    /** Dữ liệu của người dùng */
    DatabaseID: string;
    /** Địa chỉ email của User */
    Email: string;
    /** Họ và tên đầy đủ của User */
    FullName: string;
    /** Đường dẫn ảnh đại diện */
    AvatarUrl: string | null;
    /** Số điện thoại */
    PhoneNumber: string | null;
    /** Khóa chính */
    EasyMartID: string;
    /** Mã định danh khách hàng, ví dụ: CUST_001 */
    EasyMartCode: string;
    /** Tên khách hàng */
    EasyMartName: string;
}

export interface LoginResponse {
    AccessToken: string;
    RefreshToken: string;
    ExpiresDate: string;
    UserInfo: UserInfo;
}

/**
 * Dữ liệu gửi lên khi người dùng đăng nhập.
 */
export interface LoginRequest {
    /**
     * Địa chỉ email dùng để đăng nhập.
     * Không được để trống và phải đúng định dạng email.
     */
    Email: string;

    /**
     * Mật khẩu đăng nhập dạng plain text.
     * Sẽ được xác minh với hash BCrypt lưu trong database.
     * Không được để trống và phải có ít nhất 6 ký tự.
     */
    Password: string;
}

export interface RegisterRequest {
    /** Email đăng nhập - phải là email hợp lệ và chưa tồn tại trong hệ thống */
    Email: string;
    /** Họ và tên đầy đủ */
    FullName: string;
    /** Mật khẩu - sẽ được mã hóa BCrypt trước khi lưu */
    Password: string;
    /** Số điện thoại */
    PhoneNumber: string;
    /** Tên cửa hàng / doanh nghiệp */
    EasyMartName: string;
    /** Mã số thuế */
    TaxCode: string;
}
