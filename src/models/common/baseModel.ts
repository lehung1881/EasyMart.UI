import commonFunction from "@/commons/commonFunction";
import { ModelState } from "@/constants/enumration/modelState";

export type BaseFieldDataType = "string" | "number" | "boolean" | "bool" | "object" | "array" | "date" | "any";

export type BaseValidateRuleName = "NotNull" | "MaxLength";

const PRIMITIVE_DATA_TYPES: BaseFieldDataType[] = ["string", "number", "boolean", "bool", "date"];

export interface BaseValidateRuleObject {
    type: BaseValidateRuleName;
    message?: string;
    [key: string]: unknown;
}

export interface BaseFieldConfig {
    name: string;
    title?: string;
    dataType: BaseFieldDataType;
    defaultValue?: unknown;
    isPrimaryKey?: boolean;
    isDetail?: boolean;
    ignoreCheckChange?: boolean;
    detailModel?: new (data?: Record<string, unknown>) => BaseModel;
    validateRules?: BaseValidateRuleObject[];
}

export interface BaseValidationResult {
    isValid: boolean;
    errors: string;
    field: string;
}

export interface BaseChangedField {
    oldValue: unknown;
    newValue: unknown;
}

export type BaseChangeResult = Record<string, BaseChangedField>;

export interface BaseDetailItemChangeResult {
    index: number;
    modelID: unknown;
    modelState: ModelState;
    change: BaseChangeResult | null;
    detailChanges: Record<string, BaseDetailItemChangeResult[]> | null;
}

export interface BaseMasterDetailChangeResult {
    selfChange: BaseChangeResult | null;
    detailChanges: Record<string, BaseDetailItemChangeResult[]>;
}

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
 * Kiểm tra giá trị rỗng theo ngữ nghĩa nghiệp vụ.
 * @param value Giá trị cần kiểm tra.
 * @returns `true` nếu là null/undefined/chuỗi rỗng, ngược lại `false`.
 */
function isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === "string") {
        return value.trim().length === 0;
    }

    return false;
}

export class BaseModel {
    declare _fields: BaseFieldConfig[];

    protected _$data: Record<string, unknown> = {};

    private _original: Record<string, unknown> = {};

    /**
     * Trạng thái của model (Insert, Update, Delete, None).
     */
    public ModelState: ModelState = ModelState.None;

    /**
     * Khởi tạo model từ dữ liệu đầu vào.
     * @param data Dữ liệu khởi tạo cho model.
     * @param options Tùy chọn mở rộng cho model.
     */
    constructor(data?: Record<string, unknown>, options: unknown = null) {
        void options;
        this.initModel();
        if (data) {
            this.applyData(data);
        }
        this.commit();
    }

    /**
     * Khởi tạo các biến private lưu trạng thái nội bộ model.
     * @returns Không trả về dữ liệu.
     */
    protected initPrivateData(): void {
        if (!this._$data) {
            this._$data = {};
        }

        if (!this._original) {
            this._original = {};
        }
    }

    /**
     * Khởi tạo getter/setter cho toàn bộ field cấu hình trong `_fields`.
     * @returns Không trả về dữ liệu.
     */
    public initModel(): void {
        const currentModel = this as BaseModel & Record<string, unknown>;
        const fieldConfigs = this.getFieldConfigs();

        this.initPrivateData();

        fieldConfigs.forEach((fieldConfig) => {
            const currentDescriptor = Object.getOwnPropertyDescriptor(currentModel, fieldConfig.name);

            if (!currentDescriptor?.get || !currentDescriptor?.set) {
                const predefinedValue = currentModel[fieldConfig.name];

                if (Object.prototype.hasOwnProperty.call(currentModel, fieldConfig.name)) {
                    delete currentModel[fieldConfig.name];
                }

                Object.defineProperty(currentModel, fieldConfig.name, {
                    get() {
                        return currentModel._$data[fieldConfig.name];
                    },
                    set(value: unknown) {
                        currentModel.set(fieldConfig.name, value, fieldConfig.dataType);
                    },
                    enumerable: true,
                    configurable: true,
                });

                currentModel._$data[fieldConfig.name] =
                    predefinedValue !== undefined
                        ? currentModel.normalizeValue(predefinedValue, fieldConfig.dataType, fieldConfig)
                        : cloneValue(currentModel.getDefaultValue(fieldConfig));
                return;
            }

            if (!(fieldConfig.name in currentModel._$data)) {
                currentModel._$data[fieldConfig.name] = cloneValue(currentModel.getDefaultValue(fieldConfig));
            }
        });
    }

    /**
     * Lấy giá trị mặc định theo cấu hình field.
     * @param fieldConfig Cấu hình field hiện tại.
     * @returns Giá trị mặc định của field.
     */
    protected getDefaultValue(fieldConfig: BaseFieldConfig): unknown {
        if (fieldConfig.defaultValue !== undefined) {
            return fieldConfig.defaultValue;
        }

        switch (fieldConfig.dataType) {
            case "string":
                return "";
            case "number":
                return 0;
            case "boolean":
                return false;
            case "array":
                return [];
            case "object":
                return {};
            case "date":
                return null;
            default:
                return null;
        }
    }

    /**
     * Chuyển đổi dữ liệu đầu vào theo kiểu dataType đã cấu hình.
     * @param value Giá trị cần chuẩn hóa.
     * @param dataType Kiểu dữ liệu mong muốn.
     * @param fieldConfig Cấu hình field hiện tại, dùng để khởi tạo detail model nếu có.
     * @returns Giá trị đã được chuẩn hóa.
     */
    protected normalizeValue(value: unknown, dataType: BaseFieldDataType, fieldConfig?: BaseFieldConfig): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        switch (dataType) {
            case "string":
                return String(value);
            case "number": {
                const numericValue = Number(value);
                return Number.isNaN(numericValue) ? 0 : numericValue;
            }
            case "bool":
            case "boolean":
                return Boolean(value);
            case "array": {
                if (!Array.isArray(value)) return [];

                if (fieldConfig?.isDetail && fieldConfig?.detailModel) {
                    return value.map((item) => {
                        if (item instanceof BaseModel) return item;
                        return new fieldConfig.detailModel!(item as Record<string, unknown>);
                    });
                }

                return value;
            }
            case "object":
                return typeof value === "object" ? value : {};
            case "date":
                return value;
            default:
                return value;
        }
    }

    /**
     * Cập nhật dữ liệu cho 1 field theo cấu hình dataType.
     * @param fieldName Tên field cần gán.
     * @param value Giá trị cần gán.
     * @param dataType Kiểu dữ liệu của field.
     * @returns Không trả về dữ liệu.
     */
    public set(fieldName: string, value: unknown, dataType: BaseFieldDataType = "any"): void {
        const fieldConfig = this.getFieldConfigs().find((f) => f.name === fieldName);
        this._$data[fieldName] = this.normalizeValue(value, dataType, fieldConfig);
    }

    /**
     * Cập nhật giá trị cho field theo dataType được cấu hình trong `_fields`.
     * @param fieldName Tên field cần gán.
     * @param value Giá trị cần gán.
     * @returns Không trả về dữ liệu.
     */
    public setValue(fieldName: string, value: unknown): void {
        const fieldDataType = this.getFieldDataType(fieldName);
        this.set(fieldName, value, fieldDataType);
    }

    /**
     * Lấy dataType theo tên field từ `_fields`.
     * @param fieldName Tên field cần tra cứu.
     * @returns DataType tương ứng nếu có, ngược lại `"any"`.
     */
    protected getFieldDataType(fieldName: string): BaseFieldDataType {
        const fieldConfig = this.getFieldConfigs().find((item) => item.name === fieldName);
        return fieldConfig?.dataType ?? "any";
    }

    /**
     * Lấy cấu hình field khóa chính của model.
     * @returns Field khóa chính nếu có, ngược lại `undefined`.
     */
    public getPrimaryKeyField(): BaseFieldConfig | undefined {
        return this.getFieldConfigs().find((fieldConfig) => fieldConfig.isPrimaryKey);
    }

    /**
     * Đảm bảo field khóa chính có giá trị khi thêm mới.
     * Nếu khóa chính đang rỗng thì tự sinh GUID và gán vào model.
     * @returns Giá trị khóa chính sau khi xử lý, hoặc `null` nếu model không cấu hình khóa chính.
     */
    public setAutoPrimaryKey(): string | null {
        const primaryKeyField = this.getPrimaryKeyField();
        if (!primaryKeyField) {
            return null;
        }

        const currentPrimaryKeyValue = this._$data[primaryKeyField.name];
        if (!isEmptyValue(currentPrimaryKeyValue)) {
            return String(currentPrimaryKeyValue);
        }

        const generatedPrimaryKey = commonFunction.generateGUIDV7();
        this.setValue(primaryKeyField.name, generatedPrimaryKey);
        return generatedPrimaryKey;
    }

    /**
     * Chuẩn hóa validate rule về dạng mảng để xử lý đồng nhất.
     * @param validateRules Danh sách rule.
     * @returns Danh sách rule sau chuẩn hóa.
     */
    protected normalizeValidateRules(validateRules?: BaseValidateRuleObject[]): BaseValidateRuleObject[] {
        if (!validateRules) {
            return [];
        }
        return validateRules;
    }

    /**
     * Trả về thông điệp lỗi mặc định theo rule name.
     * @param fieldConfig Cấu hình field đang validate.
     * @param ruleObject Rule validate hiện tại.
     * @returns Thông điệp lỗi mặc định.
     */
    protected getDefaultValidateMessage(fieldConfig: BaseFieldConfig, ruleObject: BaseValidateRuleObject): string {
        const fieldDisplayName = fieldConfig.title ?? fieldConfig.name;

        switch (ruleObject.type) {
            case "NotNull":
                return `${fieldDisplayName} không được để trống.`;
            case "MaxLength": {
                const maxLength = Number(ruleObject.length ?? 0);
                return `${fieldDisplayName} không được vượt quá ${maxLength} ký tự.`;
            }
            default:
                return `${fieldDisplayName} không hợp lệ.`;
        }
    }

    /**
     * Validate dữ liệu theo 1 rule cụ thể.
     * @param fieldConfig Cấu hình field cần validate.
     * @param ruleObject Rule validate.
     * @param value Giá trị field hiện tại.
     * @returns Chuỗi lỗi nếu không hợp lệ, ngược lại `null`.
     */
    protected validateByRule(
        fieldConfig: BaseFieldConfig,
        ruleObject: BaseValidateRuleObject,
        value: unknown,
    ): string | null {
        switch (ruleObject.type) {
            case "NotNull":
                if (isEmptyValue(value)) {
                    return ruleObject.message ?? this.getDefaultValidateMessage(fieldConfig, ruleObject);
                }
                return null;
            case "MaxLength": {
                if (value === null || value === undefined) return null;
                if (typeof value !== "string") return null;
                const maxLength = Number(ruleObject.length ?? 0);
                if (maxLength <= 0) return null;
                if (value.length > maxLength) {
                    return ruleObject.message ?? this.getDefaultValidateMessage(fieldConfig, ruleObject);
                }
                return null;
            }
            default:
                return null;
        }
    }

    /**
     * Validate một field theo `validateRules` được cấu hình trong `_fields`.
     * @param fieldName Tên field cần validate.
     * @returns Chuỗi lỗi của field nếu có, ngược lại chuỗi rỗng.
     */
    public validateField(fieldName: string): string {
        const fieldConfig = this.getFieldConfigs().find((item) => item.name === fieldName);
        if (!fieldConfig) {
            return "";
        }

        const ruleList = this.normalizeValidateRules(fieldConfig.validateRules);
        if (ruleList.length === 0) {
            return "";
        }

        const currentValue = this._$data[fieldConfig.name];
        for (const ruleItem of ruleList) {
            const errorMessage = this.validateByRule(fieldConfig, ruleItem, currentValue);
            if (errorMessage) {
                return errorMessage;
            }
        }

        return "";
    }

    /**
     * Validate toàn bộ model theo cấu hình `validateRules` trong `_fields`.
     * @returns Kết quả validate gồm trạng thái hợp lệ và lỗi đầu tiên.
     */
    public validate(): BaseValidationResult {
        for (const fieldConfig of this.getFieldConfigs()) {
            if (!fieldConfig.validateRules || fieldConfig.validateRules.length === 0) {
                continue;
            }

            const fieldError = this.validateField(fieldConfig.name);
            if (fieldError.length > 0) {
                return {
                    isValid: false,
                    errors: fieldError,
                    field: fieldConfig.name,
                };
            }
        }

        return {
            isValid: true,
            errors: "",
            field: "",
        };
    }

    /**
     * Lấy dữ liệu dạng plain object để phục vụ so sánh snapshot.
     * @returns Dữ liệu model hiện tại theo danh sách `_fields`.
     */
    protected getComparableData(): Record<string, unknown> {
        const comparableData: Record<string, unknown> = {};

        this.getFieldConfigs().forEach((fieldConfig) => {
            comparableData[fieldConfig.name] = cloneValue(this._$data[fieldConfig.name]);
        });

        return comparableData;
    }

    /**
     * Nạp dữ liệu vào model hiện tại.
     * @param payload Dữ liệu cần gán vào model.
     * @returns Không trả về dữ liệu.
     */
    public applyData<T extends BaseModel>(payload: Partial<T> | Record<string, unknown>): void {
        const sourceData = payload as Record<string, unknown>;

        Object.keys(sourceData).forEach((fieldName) => {
            this.setValue(fieldName, sourceData[fieldName]);
        });
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
     * Rollback toàn bộ thay đổi của master và các item trong detail field về trạng thái ban đầu.
     * Xử lý đệ quy để hỗ trợ detail lồng detail.
     * @returns Không trả về dữ liệu.
     */
    public rollbackChange(): void {
        const originalData = cloneValue(this._original);

        this.getFieldConfigs()
            .filter((f) => !f.isDetail)
            .forEach((f) => {
                const originalValue = originalData[f.name];
                const currentValue = this._$data[f.name];

                if (
                    f.dataType === "object" &&
                    currentValue &&
                    typeof currentValue === "object" &&
                    !Array.isArray(currentValue) &&
                    originalValue &&
                    typeof originalValue === "object"
                ) {
                    // Patch từng key để giữ reactive proxy
                    const current = currentValue as Record<string, unknown>;
                    const original = originalValue as Record<string, unknown>;

                    // Xóa key thừa
                    Object.keys(current).forEach((key) => {
                        if (!(key in original)) {
                            delete current[key];
                        }
                    });

                    // Gán lại từng key
                    Object.keys(original).forEach((key) => {
                        current[key] = original[key];
                    });
                } else {
                    this.setValue(f.name, originalValue);
                }
            });

        this.ModelState = ModelState.None;

        this.getFieldDetailConfigs().forEach((f) => {
            const items = (this._$data[f.name] ?? []) as BaseModel[];
            items.forEach((item) => item.rollbackChange());
        });
    }

    /**
     * Kiểm tra model hiện tại có thay đổi so với snapshot ban đầu không.
     * @returns `true` nếu có thay đổi, ngược lại `false`.
     */
    public checkChange(): boolean {
        return !isEqualByKeys(this.getComparableData(), this._original);
    }

    /**
     * Lấy danh sách field thay đổi so với snapshot gốc.
     * @returns Object các field thay đổi theo dạng `{ fieldName: { oldValue, newValue } }`, hoặc `null` nếu không có thay đổi.
     */
    public getChange(): BaseChangeResult | null {
        const currentData = this.getComparableData();
        const originalData = this._original;
        const changedFields: BaseChangeResult = {};

        this.getFieldCheckChangeConfigs().forEach((fieldConfig) => {
            const fieldName = fieldConfig.name;
            const oldValue = originalData[fieldName];
            const newValue = currentData[fieldName];

            if (!isEqualByKeys(oldValue, newValue)) {
                changedFields[fieldName] = {
                    oldValue: cloneValue(oldValue),
                    newValue: cloneValue(newValue),
                };
            }
        });

        return Object.keys(changedFields).length === 0 ? null : changedFields;
    }

    /**
     * Tổng hợp thay đổi của master và toàn bộ từng item trong các detail field.
     * Xử lý đệ quy để hỗ trợ detail lồng detail.
     * @returns Object chứa selfChange và detailChanges, hoặc null nếu không có thay đổi nào.
     */
    public getAllChange(): BaseMasterDetailChangeResult | null {
        const selfChange = this.getChange();
        const detailChanges: Record<string, BaseDetailItemChangeResult[]> = {};

        this.getFieldDetailConfigs().forEach((f) => {
            const items = (this._$data[f.name] ?? []) as BaseModel[];
            const itemChanges: BaseDetailItemChangeResult[] = [];

            items.forEach((item, index) => {
                const nestedResult = item.getAllChange();
                const hasChange = nestedResult !== null;

                if (!hasChange) return;

                const primaryKeyField = item.getPrimaryKeyField();
                const modelID = primaryKeyField ? item._$data[primaryKeyField.name] : null;

                itemChanges.push({
                    index,
                    modelID,
                    modelState: item.ModelState,
                    change: nestedResult?.selfChange ?? null,
                    detailChanges: nestedResult?.detailChanges ?? null,
                });
            });

            if (itemChanges.length > 0) {
                detailChanges[f.name] = itemChanges;
            }
        });

        if (selfChange === null && Object.keys(detailChanges).length === 0) return null;

        return { selfChange, detailChanges };
    }

    /**
     * Commit toàn bộ thay đổi của master và các item trong detail field.
     * Xử lý đệ quy để hỗ trợ detail lồng detail.
     * @returns Không trả về dữ liệu.
     */
    public commitChange(): void {
        this.commit();
        this.ModelState = ModelState.None;
        this.getFieldDetailConfigs().forEach((f) => {
            const items = (this._$data[f.name] ?? []) as BaseModel[];
            items.forEach((item) => item.commitChange());
        });
    }

    /**
     * Chuẩn bị ModelState cho master và toàn bộ item detail trước khi lưu.
     * Xử lý đệ quy để hỗ trợ detail lồng detail.
     * @returns Không trả về dữ liệu.
     */
    public prepareModelState(): void {
        if (this.ModelState === ModelState.None && this.getChange() !== null) {
            this.ModelState = ModelState.Update;
        }

        this.getFieldDetailConfigs().forEach((f) => {
            const items = (this._$data[f.name] ?? []) as BaseModel[];
            items.forEach((item) => {
                item.prepareModelState();
            });
        });
    }

    /**
     * Serialize model thành plain object chỉ chứa thuộc tính, không có method.
     * Detail field được map thành array of plain object đệ quy.
     * @returns Plain object sẵn sàng gửi BE.
     */
    public getSaveData(): Record<string, unknown> {
        this.prepareModelState();

        const detailFieldNames = new Set(this.getFieldDetailConfigs().map((f) => f.name));

        const result: Record<string, unknown> = {
            ModelState: this.ModelState,
        };

        this.getFieldConfigs().forEach((fieldConfig) => {
            if (detailFieldNames.has(fieldConfig.name)) {
                const items = (this._$data[fieldConfig.name] ?? []) as BaseModel[];
                result[fieldConfig.name] = items.map((item) => item.getSaveData());
            } else {
                result[fieldConfig.name] = this._$data[fieldConfig.name];
            }
        });

        return result;
    }

    /**
     * Lấy danh sách field config từ model hiện tại.
     * @returns Danh sách field đã cấu hình hoặc mảng rỗng.
     */
    protected getFieldConfigs(): BaseFieldConfig[] {
        const configuredFields = (this as unknown as { _fields?: BaseFieldConfig[] })._fields;
        return Array.isArray(configuredFields) ? configuredFields : [];
    }

    /**
     * Lấy danh sách field config được dùng để check change.
     * Loại bỏ các field isDetail, ignoreCheckChange và không phải kiểu nguyên thủy.
     * @returns Danh sách field config hợp lệ để so sánh thay đổi.
     */
    protected getFieldCheckChangeConfigs(): BaseFieldConfig[] {
        return this.getFieldConfigs().filter(
            (fieldConfig) =>
                !fieldConfig.isDetail &&
                !fieldConfig.ignoreCheckChange &&
                PRIMITIVE_DATA_TYPES.includes(fieldConfig.dataType),
        );
    }

    /**
     * Lấy danh sách field config được cấu hình là detail.
     * @returns Danh sách field config có isDetail = true.
     */
    protected getFieldDetailConfigs(): BaseFieldConfig[] {
        return this.getFieldConfigs().filter((fieldConfig) => fieldConfig.isDetail);
    }
}

export default BaseModel;
