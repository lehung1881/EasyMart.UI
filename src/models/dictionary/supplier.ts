import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model nhà cung cấp
 */
export class SupplierModel extends BaseModel {
    /** Khóa chính */
    declare SupplierID: string;

    /** Mã nhà cung cấp (unique) */
    declare SupplierCode: string;

    /** Tên nhà cung cấp */
    declare SupplierName: string;

    /** Loại (0: Cá nhân, 1: Doanh nghiệp) */
    declare SupplierType: number;

    /** Số điện thoại */
    declare PhoneNumber: string | null;

    /** Email */
    declare Email: string | null;

    /** Mã số thuế */
    declare TaxCode: string | null;

    /** Địa chỉ */
    declare Address: string | null;

    /** Trạng thái (1: Đang sử dụng, 2: Ngừng sử dụng) */
    declare Status: number;

    constructor(data?: Partial<SupplierModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SupplierModel.prototype._fields = [
    { name: "SupplierID", dataType: "string", defaultValue: null, isPrimaryKey: true },

    {
        name: "SupplierCode",
        title: "Mã nhà cung cấp",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 50 }],
    },

    {
        name: "SupplierName",
        title: "Tên nhà cung cấp",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 255 }],
    },

    { name: "SupplierType", dataType: "number", defaultValue: 0 },

    { name: "PhoneNumber", dataType: "string", defaultValue: null },

    { name: "Email", dataType: "string", defaultValue: null },

    { name: "TaxCode", dataType: "string", defaultValue: null },

    { name: "Address", dataType: "string", defaultValue: null },

    { name: "Status", dataType: "number", defaultValue: 1 },
] as BaseFieldConfig[];

export default SupplierModel;
