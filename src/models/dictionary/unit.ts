import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model đơn vị tính
 */
export class UnitModel extends BaseModel {
    /** Khóa chính */
    declare UnitID: string;

    /** Tên đơn vị (Cái, Hộp, Thùng...) */
    declare UnitName: string;

    /** Mô tả */
    declare Description: string | null;

    /** Trạng thái (1: Đang sử dụng, 2: Ngừng sử dụng) */
    declare Status: number;

    constructor(data?: Partial<UnitModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

UnitModel.prototype._fields = [
    { name: "UnitID", dataType: "string", defaultValue: null, isPrimaryKey: true },

    {
        name: "UnitName",
        title: "Tên đơn vị",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 100 }],
    },

    { name: "Description", dataType: "string", defaultValue: null },

    { name: "Status", dataType: "number", defaultValue: 1 },
] as BaseFieldConfig[];

export default UnitModel;
