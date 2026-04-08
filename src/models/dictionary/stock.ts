import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model kho
 */
export class StockModel extends BaseModel {
    /** Khóa chính */
    declare StockID: string;

    /** Mã kho */
    declare StockCode: string;

    /** Tên kho */
    declare StockName: string;

    /** Mô tả */
    declare Description: string | null;

    /** Trạng thái (1: Đang sử dụng, 2: Ngừng sử dụng) */
    declare Status: number;

    /** Địa chỉ kho */
    declare Address: string | null;

    constructor(data?: Partial<StockModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

StockModel.prototype._fields = [
    { name: "StockID", dataType: "string", defaultValue: null, isPrimaryKey: true },

    {
        name: "StockCode",
        title: "Mã kho",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 50 }],
    },

    {
        name: "StockName",
        title: "Tên kho",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 255 }],
    },

    { name: "Description", dataType: "string", defaultValue: null },

    { name: "Status", dataType: "number", defaultValue: 1 },

    { name: "Address", dataType: "string", defaultValue: null },
] as BaseFieldConfig[];

export default StockModel;
