/**
 * Loại storage dùng để lưu cache.
 * 1: localStorage, 2: sessionStorage.
 */
export const CacheStorageType = {
    LocalStorage: 1,
    SessionStorage: 2,
} as const;

export type CacheStorageType = (typeof CacheStorageType)[keyof typeof CacheStorageType];

/**
 * Action xử lý cache theo ngữ cảnh nghiệp vụ.
 * 1: xóa khi đăng xuất, 2: giữ lại khi đăng xuất.
 */
export const CacheAction = {
    ClearOnLogout: 1,
    KeepOnLogout: 2,
} as const;

export type CacheAction = (typeof CacheAction)[keyof typeof CacheAction];

/**
 * Mã định danh key cache để gọi API set/get theo code.
 */
export const CacheCode = {
    AuthAccessToken: "AuthAccessToken",
    AuthRefreshToken: "AuthRefreshToken",
    AuthAccessTokenExpires: "AuthAccessTokenExpires",
    AuthUserInfo: "AuthUserInfo",
    UserInfoByEasyMartAndUser: "UserInfoByEasyMartAndUser",
    Locale: "Locale",
} as const;

export type CacheCode = (typeof CacheCode)[keyof typeof CacheCode];

/**
 * Cấu hình cho một key cache.
 */
export type CacheConfigItem = {
    Code: CacheCode;
    KeyFormat: string;
    CacheType: CacheStorageType;
    Expires: number;
    Action: CacheAction;
};

/**
 * Danh sách cấu hình cache trung tâm.
 * Expires tính theo giây; <= 0 nghĩa là không hết hạn.
 */
export const cacheConfigList: CacheConfigItem[] = [
    {
        Code: CacheCode.AuthAccessToken,
        KeyFormat: "access_token",
        CacheType: CacheStorageType.LocalStorage,
        Expires: 0,
        Action: CacheAction.ClearOnLogout,
    },
    {
        Code: CacheCode.AuthRefreshToken,
        KeyFormat: "refresh_token",
        CacheType: CacheStorageType.LocalStorage,
        Expires: 0,
        Action: CacheAction.ClearOnLogout,
    },
    {
        Code: CacheCode.AuthAccessTokenExpires,
        KeyFormat: "access_token_expires",
        CacheType: CacheStorageType.LocalStorage,
        Expires: 0,
        Action: CacheAction.ClearOnLogout,
    },
    {
        Code: CacheCode.AuthUserInfo,
        KeyFormat: "user_info",
        CacheType: CacheStorageType.LocalStorage,
        Expires: 0,
        Action: CacheAction.ClearOnLogout,
    },
];

/**
 * Map tra cứu nhanh config theo Code.
 */
export const cacheConfigMap = new Map(cacheConfigList.map((item) => [item.Code, item]));
