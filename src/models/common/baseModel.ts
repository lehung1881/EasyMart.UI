/**
 * Clone dữ liệu để lưu snapshot object cho model.
 * @param value Dữ liệu cần clone.
 * @returns Bản sao của dữ liệu đầu vào.
 */
function cloneValue<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => cloneValue(item)) as T;
    }

    if (value && typeof value === "object") {
        const source = value as Record<string, unknown>;
        const target: Record<string, unknown> = {};

        Object.keys(source).forEach((key) => {
            target[key] = cloneValue(source[key]);
        });

        return target as T;
    }

    return value;
}

/**
 * So sánh 2 giá trị theo từng key, hỗ trợ object lồng nhau và array.
 * @param left Giá trị bên trái.
 * @param right Giá trị bên phải.
 * @returns `true` nếu 2 giá trị bằng nhau, ngược lại `false`.
 */
function isEqualByKeys(left: unknown, right: unknown): boolean {
    if (left === right) {
        return true;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right)) {
            return false;
        }

        if (left.length !== right.length) {
            return false;
        }

        return left.every((item, index) => isEqualByKeys(item, right[index]));
    }

    if (left && right && typeof left === "object" && typeof right === "object") {
        const leftObject = left as Record<string, unknown>;
        const rightObject = right as Record<string, unknown>;
        const leftKeys = Object.keys(leftObject);
        const rightKeys = Object.keys(rightObject);

        if (leftKeys.length !== rightKeys.length) {
            return false;
        }

        return leftKeys.every((key) => isEqualByKeys(leftObject[key], rightObject[key]));
    }

    return false;
}

/**
 * Base model dùng chung cho tất cả form detail.
 * Cung cấp cơ chế snapshot dữ liệu gốc và kiểm tra thay đổi.
 */
export class BaseModel {
    private _original: Record<string, unknown> = {};

    /**
     * Khởi tạo model và chụp snapshot ban đầu.
     * @param initialData Dữ liệu khởi tạo cho model.
     */
    constructor(initialData?: Partial<Record<string, unknown>>) {
        if (initialData) {
            this.applyData(initialData);
        }
        this.commit();
    }

    /**
     * Lấy dữ liệu dạng plain object để phục vụ so sánh snapshot.
     * @returns Dữ liệu model hiện tại bỏ qua các field nội bộ bắt đầu bằng `_`.
     */
    protected getComparableData(): Record<string, unknown> {
        const modelData: Record<string, unknown> = {};

        Object.keys(this).forEach((key) => {
            if (key.startsWith("_")) {
                return;
            }

            const typedThis = this as unknown as Record<string, unknown>;
            modelData[key] = typedThis[key];
        });

        return modelData;
    }

    /**
     * Nạp dữ liệu vào model hiện tại.
     * @param payload Dữ liệu cần gán vào model.
     * @returns Không trả về dữ liệu.
     */
    public applyData<T extends BaseModel>(payload: Partial<T>): void {
        Object.assign(this as object, payload);
    }

    /**
     * Commit dữ liệu hiện tại làm mốc gốc mới cho model.
     * @returns Không trả về dữ liệu.
     */
    public commit(): void {
        this._original = cloneValue(this.getComparableData());
    }

    /**
     * Chụp snapshot dữ liệu hiện tại làm mốc so sánh thay đổi.
     * @returns Không trả về dữ liệu.
     */
    public captureOriginalState(): void {
        this.commit();
    }

    /**
     * Khôi phục model về trạng thái snapshot gần nhất.
     * @returns Không trả về dữ liệu.
     */
    public restoreOriginalState(): void {
        this.applyData(cloneValue(this._original));
    }

    /**
     * Kiểm tra model hiện tại có thay đổi so với snapshot ban đầu không.
     * @returns `true` nếu có thay đổi, ngược lại `false`.
     */
    public checkChange(): boolean {
        return !isEqualByKeys(this.getComparableData(), this._original);
    }

    /**
     * Alias theo naming cũ cho hàm kiểm tra thay đổi.
     * @returns `true` nếu có thay đổi, ngược lại `false`.
     */
    public checkchange(): boolean {
        return this.checkChange();
    }
}

export default BaseModel;
