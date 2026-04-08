import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model khách hàng
 */
export class CustomerModel extends BaseModel {
    /** Khóa chính */
    declare CustomerID: string;

    /** Mã khách hàng (unique) */
    declare CustomerCode: string;

    /** Tên khách hàng */
    declare CustomerName: string;

    /** Loại (0: Cá nhân, 1: Doanh nghiệp) */
    declare CustomerType: number;

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

    constructor(data?: Partial<CustomerModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

CustomerModel.prototype._fields = [
    { name: "CustomerID", dataType: "string", defaultValue: null, isPrimaryKey: true },

    {
        name: "CustomerCode",
        title: "Mã khách hàng",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 50 }],
    },

    {
        name: "CustomerName",
        title: "Tên khách hàng",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 255 }],
    },

    { name: "CustomerType", dataType: "number", defaultValue: 0 },

    { name: "PhoneNumber", dataType: "string", defaultValue: null },

    { name: "Email", dataType: "string", defaultValue: null },

    { name: "TaxCode", dataType: "string", defaultValue: null },

    { name: "Address", dataType: "string", defaultValue: null },

    { name: "Status", dataType: "number", defaultValue: 1 },
] as BaseFieldConfig[];

export default CustomerModel;
