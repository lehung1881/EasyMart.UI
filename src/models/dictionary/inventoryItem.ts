import BaseModel from "@/models/common/baseModel";

export interface InventoryItemImage {
    url: string;
    isPrimary: boolean;
}

/**
 * Model chi tiết hàng hóa kế thừa base model dùng chung.
 */
export class InventoryItemModel extends BaseModel {
    InventoryItemID = "";
    ReleaseMethod = 0;
    UnitID = "";
    UnitName = "";
    InventoryItemCode = "";
    InventoryItemName = "";
    InventoryItemType = 0;
    InventoryItemCategoryIDList = "";
    InventoryItemCategoryCodeList = "";
    InventoryItemCategoryNameList = "";
    MaximumStock = 0;
    MinimumStock = 0;
    QuantityBalance = 0;
    WarrantyTimeUnit = 0;
    InventoryItemSource = "";
    Description = "";
    Images = "";
    Inactive = 0;
    UnitList: unknown[] | null = null;
    BuyPrice = 0;
    SellPrice = 0;
    BackEndFormula: string | null = null;
    FrontEndFormula: string | null = null;
    DICustomField1: string | null = null;
    DICustomField2: string | null = null;
    DICustomField3: string | null = null;
    DICustomField4: string | null = null;
    DICustomField5: string | null = null;
    DICustomField6: string | null = null;
    DICustomField7: string | null = null;
    DICustomField8: string | null = null;
    DICustomField9: string | null = null;
    DICustomField10: string | null = null;
    CreatedDate = "";
    CreatedBy = "";
    ModifiedDate: string | null = null;
    ModifiedBy: string | null = null;
    IsFollowSerialNumber = 0;
    IsAllowDuplicateSerialNumber = 0;
    WarrantyTime = 0;
    BaseOnFormula: string | null = null;
    QuantityAvailable = 0;
    InventoryCombo: string | null = null;

    /**
     * Khởi tạo model hàng hóa từ dữ liệu ban đầu.
     * @param initialData Dữ liệu gán ban đầu cho model.
     */
    constructor(initialData?: Partial<InventoryItemModel>) {
        super();
        if (initialData) {
            this.applyData(initialData);
        }
        this.captureOriginalState();
    }
}

export default InventoryItemModel;
