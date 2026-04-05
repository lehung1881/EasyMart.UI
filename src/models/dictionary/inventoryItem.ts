import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";

export interface InventoryItemImage {
    url: string;
    isPrimary: boolean;
}

/**
 * Model chi tiết hàng hóa kế thừa base model dùng chung.
 */
export class InventoryItemModel extends BaseModel {
    declare InventoryItemID: string;
    declare ReleaseMethod: number;
    declare UnitID: string;
    declare UnitName: string;
    declare InventoryItemCode: string;
    declare InventoryItemName: string;
    declare InventoryItemType: number;
    declare InventoryItemCategoryIDList: string;
    declare InventoryItemCategoryCodeList: string;
    declare InventoryItemCategoryNameList: string;
    declare MaximumStock: number;
    declare MinimumStock: number;
    declare QuantityBalance: number;
    declare WarrantyTimeUnit: number;
    declare InventoryItemSource: string;
    declare Description: string;
    declare Images: string | null;
    declare Inactive: number;
    declare UnitList: unknown[] | null;
    declare BuyPrice: number;
    declare SellPrice: number;
    declare BackEndFormula: string | null;
    declare FrontEndFormula: string | null;
    declare DICustomField1: string | null;
    declare DICustomField2: string | null;
    declare DICustomField3: string | null;
    declare DICustomField4: string | null;
    declare DICustomField5: string | null;
    declare DICustomField6: string | null;
    declare DICustomField7: string | null;
    declare DICustomField8: string | null;
    declare DICustomField9: string | null;
    declare DICustomField10: string | null;
    declare CreatedDate: string;
    declare CreatedBy: string;
    declare ModifiedDate: string | null;
    declare ModifiedBy: string | null;
    declare IsFollowSerialNumber: number;
    declare IsAllowDuplicateSerialNumber: number;
    declare WarrantyTime: number;
    declare BaseOnFormula: string | null;
    declare QuantityAvailable: number;
    declare InventoryCombo: string | null;

    /**
     * Khởi tạo model hàng hóa từ dữ liệu ban đầu.
     * @param data Dữ liệu gán ban đầu cho model.
     * @param options Tùy chọn mở rộng cho model.
     */
    constructor(data?: Partial<InventoryItemModel>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

InventoryItemModel.prototype._fields = [
    { name: "InventoryItemID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "ReleaseMethod", dataType: "number" },
    { name: "UnitID", dataType: "string" },
    { name: "UnitName", dataType: "string" },
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
    { name: "InventoryItemType", dataType: "number" },
    { name: "InventoryItemCategoryIDList", dataType: "string" },
    { name: "InventoryItemCategoryCodeList", dataType: "string" },
    { name: "InventoryItemCategoryNameList", dataType: "string" },
    { name: "MaximumStock", dataType: "number" },
    { name: "MinimumStock", dataType: "number" },
    { name: "QuantityBalance", dataType: "number" },
    { name: "WarrantyTimeUnit", dataType: "number" },
    { name: "InventoryItemSource", dataType: "string" },
    { name: "Description", dataType: "string" },
    { name: "Images", dataType: "string", defaultValue: null },
    { name: "Inactive", dataType: "number" },
    { name: "UnitList", dataType: "array", defaultValue: null },
    { name: "BuyPrice", dataType: "number" },
    { name: "SellPrice", dataType: "number" },
    { name: "BackEndFormula", dataType: "string", defaultValue: null },
    { name: "FrontEndFormula", dataType: "string", defaultValue: null },
    { name: "DICustomField1", dataType: "string", defaultValue: null },
    { name: "DICustomField2", dataType: "string", defaultValue: null },
    { name: "DICustomField3", dataType: "string", defaultValue: null },
    { name: "DICustomField4", dataType: "string", defaultValue: null },
    { name: "DICustomField5", dataType: "string", defaultValue: null },
    { name: "DICustomField6", dataType: "string", defaultValue: null },
    { name: "DICustomField7", dataType: "string", defaultValue: null },
    { name: "DICustomField8", dataType: "string", defaultValue: null },
    { name: "DICustomField9", dataType: "string", defaultValue: null },
    { name: "DICustomField10", dataType: "string", defaultValue: null },
    { name: "CreatedDate", dataType: "string" },
    { name: "CreatedBy", dataType: "string" },
    { name: "ModifiedDate", dataType: "string", defaultValue: null },
    { name: "ModifiedBy", dataType: "string", defaultValue: null },
    { name: "IsFollowSerialNumber", dataType: "number" },
    { name: "IsAllowDuplicateSerialNumber", dataType: "number" },
    { name: "WarrantyTime", dataType: "number" },
    { name: "BaseOnFormula", dataType: "string", defaultValue: null },
    { name: "QuantityAvailable", dataType: "number" },
    { name: "InventoryCombo", dataType: "string", defaultValue: null },
] as BaseFieldConfig[];

export default InventoryItemModel;
