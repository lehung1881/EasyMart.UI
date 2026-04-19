import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model khách hàng
 */
export class UnitConversionModel extends BaseModel {
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

    constructor(data?: Partial<UnitConversionModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

UnitConversionModel.prototype._fields = [
    { name: "UnitConversionID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "UnitID", dataType: "string" },
    { name: "UnitName", dataType: "string" },
    { name: "ConversionOperator", dataType: "number" },
] as BaseFieldConfig[];

export default UnitConversionModel;
