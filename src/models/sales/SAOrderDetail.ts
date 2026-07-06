import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

/**
 * Model chi tiết đơn hàng bán.
 */
export class SAOrderDetail extends BaseModel {
    /** Khóa chính dòng chi tiết. */
    declare RefDetailID: string;

    /** Khóa ngoại về đơn hàng master. */
    declare RefID: string;

    /** ID sản phẩm/hàng hóa. */
    declare InventoryItemID: string;

    /** Mã sản phẩm snapshot tại thời điểm bán. */
    declare InventoryItemCode: string;

    /** Tên sản phẩm snapshot tại thời điểm bán. */
    declare InventoryItemName: string;

    /** Diễn giải chi tiết dòng. */
    declare Description: string | null;

    /** ID đơn vị tính. */
    declare UnitID: string | null;

    /** Tên đơn vị tính snapshot. */
    declare UnitName: string | null;

    /** ID đơn vị tính chính. */
    declare MainUnitID: string | null;

    /** Tên đơn vị tính chính snapshot. */
    declare MainUnitName: string | null;

    /** Tỉ lệ quy đổi đơn vị tính. */
    declare ExchangeRate: number;
    
    /** Phép tính quy đổi đơn vị tính ("*" hoặc "/"). Mặc định: "*". */
    declare ExchangeRateOperator: "*" | "/";

    /** Số lượng bán. */
    declare Quantity: number;

    /** Số lượng theo đơn vị tính chính. */
    declare MainQuantity: number;

    /** Đơn giá bán. */
    declare UnitPrice: number;

    /** Đơn giá theo đơn vị tính chính. */
    declare MainUnitPrice: number;

    /** Tỷ lệ chiết khấu. */
    declare DiscountRate: number;

    /** Số tiền giảm giá trên dòng. */
    declare DiscountAmount: number;

    /** Tỷ lệ VAT. */
    declare VatRate: number;

    /** Tên mức VAT. */
    declare VatRateName: string | null;

    /** Số tiền VAT. */
    declare VatAmount: number;

    /** Thành tiền dòng. */
    declare Amount: number;

    /** Số thứ tự dòng. */
    declare SortOrder: number;

    /** Ngày tạo bản ghi. */
    declare CreatedDate: string | null;

    /** Người tạo bản ghi. */
    declare CreatedBy: string | null;

    /** Ngày sửa gần nhất. */
    declare ModifiedDate: string | null;

    /** Người sửa gần nhất. */
    declare ModifiedBy: string | null;

    constructor(data?: Partial<SAOrderDetail>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SAOrderDetail.prototype._fields = [
    { name: "RefDetailID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "RefID", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "InventoryItemID", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "InventoryItemCode", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "InventoryItemName", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "Description", dataType: "string", defaultValue: null },
    { name: "UnitID", dataType: "string", defaultValue: null },
    { name: "UnitName", dataType: "string", defaultValue: null },
    { name: "MainUnitID", dataType: "string", defaultValue: null },
    { name: "MainUnitName", dataType: "string", defaultValue: null },
    { name: "Quantity", dataType: "number", defaultValue: 0 },
    { name: "MainQuantity", dataType: "number", defaultValue: 0 },
    { name: "UnitPrice", dataType: "number", defaultValue: 0 },
    { name: "MainUnitPrice", dataType: "number", defaultValue: 0 },
    { name: "DiscountRate", dataType: "number", defaultValue: 0 },
    { name: "DiscountAmount", dataType: "number", defaultValue: 0 },
    { name: "VatRate", dataType: "number", defaultValue: 0 },
    { name: "VatRateName", dataType: "string", defaultValue: null },
    { name: "VatAmount", dataType: "number", defaultValue: 0 },
    { name: "Amount", dataType: "number", defaultValue: 0 },
    { name: "SortOrder", dataType: "number", defaultValue: 1 },
    { name: "CreatedDate", dataType: "string", defaultValue: null },
    { name: "CreatedBy", dataType: "string", defaultValue: null },
    { name: "ModifiedDate", dataType: "string", defaultValue: null },
    { name: "ModifiedBy", dataType: "string", defaultValue: null },
] as BaseFieldConfig[];

export default SAOrderDetail;
