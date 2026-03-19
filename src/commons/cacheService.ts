import {
    CacheStorageType,
    type CacheAction,
    type CacheCode,
    type CacheConfigItem,
    cacheConfigList,
    cacheConfigMap,
} from "@/constants/cacheConfig";

type CacheValueWrapper<T> = {
    Data: T;
    ExpireDate: number | null;
};

type CacheKeyParams = Record<string, string | number>;

const VALID_PLACEHOLDER_REGEX = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
const ANY_PLACEHOLDER_REGEX = /\{([^{}]+)\}/g;

class CacheService {
    /**
     * Lưu dữ liệu vào cache theo Code + object params của KeyFormat.
     */
    set<T>(code: CacheCode, value: T, params: CacheKeyParams = {}): void {
        const config = this.getConfigOrThrow(code);
        const key = this.buildKey(config.KeyFormat, params);
        const storage = this.getStorage(config.CacheType);

        const payload: CacheValueWrapper<T> = {
            Data: value,
            ExpireDate: this.buildExpireDate(config.Expires),
        };

        storage.setItem(key, JSON.stringify(payload));
    }

    /**
     * Đọc dữ liệu cache; tự động xóa nếu payload hỏng hoặc đã hết hạn.
     */
    get<T>(code: CacheCode, params: CacheKeyParams = {}): T | null {
        const config = this.getConfigOrThrow(code);
        const key = this.buildKey(config.KeyFormat, params);
        const storage = this.getStorage(config.CacheType);
        const raw = storage.getItem(key);

        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw) as Partial<CacheValueWrapper<T>>;

            if (!this.isValidPayload(parsed)) {
                storage.removeItem(key);
                return null;
            }

            if (this.isExpired(parsed.ExpireDate)) {
                storage.removeItem(key);
                return null;
            }

            return parsed.Data as T;
        } catch {
            storage.removeItem(key);
            return null;
        }
    }

    /**
     * Xóa tất cả key cache có Action trùng với action đầu vào.
     */
    clearByAction(action: CacheAction): void {
        const configs = cacheConfigList.filter((item) => item.Action === action);

        for (const config of configs) {
            const storage = this.getStorage(config.CacheType);
            const regex = this.buildKeyRegex(config.KeyFormat);
            const keysToRemove: string[] = [];

            for (let i = 0; i < storage.length; i += 1) {
                const key = storage.key(i);
                if (key && regex.test(key)) {
                    keysToRemove.push(key);
                }
            }

            for (const key of keysToRemove) {
                storage.removeItem(key);
            }
        }
    }

    /**
     * Lấy config theo code, throw lỗi nếu chưa khai báo.
     */
    private getConfigOrThrow(code: CacheCode): CacheConfigItem {
        const config = cacheConfigMap.get(code);
        if (!config) {
            throw new Error(`[CacheService] Mã cache '${code}' chưa được cấu hình.`);
        }

        return config;
    }

    /**
     * Chọn đúng storage implementation theo config.
     */
    private getStorage(type: CacheStorageType): Storage {
        if (typeof window === "undefined") {
            throw new Error("[CacheService] Không thể truy cập bộ nhớ trình duyệt.");
        }

        return type === CacheStorageType.LocalStorage ? window.localStorage : window.sessionStorage;
    }

    /**
     * Chuyển Expires (giây) thành mốc thời gian ms; <= 0 là không hết hạn.
     */
    private buildExpireDate(expiresInSeconds: number): number | null {
        if (expiresInSeconds <= 0) return null;
        return Date.now() + expiresInSeconds * 1000;
    }

    /**
     * Kiểm tra mốc hết hạn với cơ chế absolute TTL.
     * Quy ước vô thời hạn: ExpireDate = null hoặc ExpireDate <= 0.
     */
    private isExpired(expireDate: number | null): boolean {
        if (expireDate === null || expireDate <= 0) return false;
        return Date.now() > expireDate;
    }

    /**
     * Build key thật từ KeyFormat + params object; ví dụ: user_info_{a}_{b}.
     */
    private buildKey(format: string, params: CacheKeyParams): string {
        this.validateFormatPattern(format);

        return format.replace(VALID_PLACEHOLDER_REGEX, (_full, keyName: string) => {
            if (!Object.prototype.hasOwnProperty.call(params, keyName)) {
                throw new Error(`[CacheService] Thiếu tham số key '${keyName}' cho định dạng '${format}'.`);
            }

            const value = params[keyName];
            if (value === "" || value === null || value === undefined) {
                throw new Error(`[CacheService] Tham số key '${keyName}' đang rỗng cho định dạng '${format}'.`);
            }

            return String(value);
        });
    }

    /**
     * Validate KeyFormat theo chuẩn placeholder tên: {a}, {tenantId}.
     */
    private validateFormatPattern(format: string): void {
        for (const match of format.matchAll(ANY_PLACEHOLDER_REGEX)) {
            const name = match[1];
            if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
                throw new Error(
                    `[CacheService] Placeholder '${name ?? ""}' trong định dạng '${format}' không hợp lệ. ` +
                        "Chỉ hỗ trợ placeholder theo tên như {a} hoặc {tenantId}.",
                );
            }
        }

        const stripped = format.replace(VALID_PLACEHOLDER_REGEX, "");
        if (stripped.includes("{") || stripped.includes("}")) {
            throw new Error(`[CacheService] Định dạng key '${format}' không hợp lệ.`);
        }
    }

    /**
     * Sinh regex để xóa nhóm key theo KeyFormat có placeholder theo tên.
     */
    private buildKeyRegex(format: string): RegExp {
        this.validateFormatPattern(format);

        const escaped = this.escapeRegex(format);
        const wildcardPattern = escaped.replace(/\\\{[a-zA-Z_][a-zA-Z0-9_]*\\\}/g, "[^{}]+");
        return new RegExp(`^${wildcardPattern}$`);
    }

    /**
     * Escape ký tự đặc biệt khi build regex từ string key format.
     */
    private escapeRegex(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Validate wrapper dữ liệu đúng shape { Data, ExpireDate }.
     */
    private isValidPayload<T>(value: Partial<CacheValueWrapper<T>>): value is CacheValueWrapper<T> {
        if (typeof value !== "object" || value === null) return false;
        if (!("Data" in value)) return false;
        if (!("ExpireDate" in value)) return false;

        const expireDate = value.ExpireDate;
        return expireDate === null || typeof expireDate === "number";
    }
}

export default new CacheService();
