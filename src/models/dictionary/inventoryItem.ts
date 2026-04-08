import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model danh mục hàng hóa
 */
export class InventoryItemModel extends BaseModel {
    /** Khóa chính */
    declare InventoryItemID: string;

    /** Mã hàng hóa (SKU), duy nhất */
    declare InventoryItemCode: string;

    /** Tên hàng hóa */
    declare InventoryItemName: string;

    /** Loại hàng hóa (0: Hàng hóa, 1: Dịch vụ) */
    declare InventoryItemType: number;

    /** ID đơn vị tính chính */
    declare UnitID: string | null;

    /** Tên đơn vị tính (snapshot để hiển thị nhanh) */
    declare UnitName: string | null;

    /** Giá mua */
    declare BuyPrice: number;

    /** Giá bán */
    declare SellPrice: number;

    /** ID kho mặc định */
    declare StockID: string | null;

    /** Số lượng tồn tối thiểu */
    declare MinimumStock: number;

    /** Danh sách ảnh (JSON string) */
    declare Images: string | null;

    /** Trạng thái (1: Đang sử dụng, 2: Ngừng sử dụng) */
    declare Status: number;

    /** Mô tả */
    declare Description: string | null;

    constructor(data?: Partial<InventoryItemModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

InventoryItemModel.prototype._fields = [
    {
        name: "InventoryItemID",
        dataType: "string",
        defaultValue: null,
        isPrimaryKey: true,
    },
    {
        name: "InventoryItemCode",
        title: "Mã hàng hóa",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 50 }],
    },
    {
        name: "InventoryItemName",
        title: "Tên hàng hóa",
        dataType: "string",
        defaultValue: null,
        validateRules: [{ type: "NotNull" }, { type: "MaxLength", length: 255 }],
    },
    {
        name: "InventoryItemType",
        title: "Loại hàng hóa",
        dataType: "number",
        defaultValue: 0,
        validateRules: [{ type: "NotNull" }],
    },

    {
        name: "UnitID",
        dataType: "string",
        defaultValue: null,
    },
    {
        name: "UnitName",
        dataType: "string",
        defaultValue: null,
    },

    {
        name: "BuyPrice",
        dataType: "number",
        defaultValue: 0,
    },
    {
        name: "SellPrice",
        dataType: "number",
        defaultValue: 0,
    },
    {
        name: "StockID",
        dataType: "string",
        defaultValue: null,
    },
    {
        name: "MinimumStock",
        dataType: "number",
        defaultValue: 0,
    },
    {
        name: "Images",
        dataType: "string",
        defaultValue: null,
    },
    {
        name: "Status",
        dataType: "number",
        defaultValue: 1,
    },
    {
        name: "Description",
        dataType: "string",
        defaultValue: null,
    },
] as BaseFieldConfig[];

export default InventoryItemModel;
