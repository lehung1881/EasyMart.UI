export interface InventoryItemImage {
    url: string;
    isPrimary: boolean;
}

export interface InventoryItem {
    InventoryItemID: string;
    ReleaseMethod: number;
    UnitID: string;
    UnitName: string;
    InventoryItemCode: string;
    InventoryItemName: string;
    InventoryItemType: number;
    InventoryItemCategoryIDList: string;
    InventoryItemCategoryCodeList: string;
    InventoryItemCategoryNameList: string;
    MaximumStock: number;
    MinimumStock: number;
    QuantityBalance: number;
    WarrantyTimeUnit: number;
    InventoryItemSource: string;
    Description: string;
    Images: string;
    Inactive: number;
    UnitList: unknown[] | null;
    BuyPrice: number;
    SellPrice: number;
    BackEndFormula: string | null;
    FrontEndFormula: string | null;
    DICustomField1: string | null;
    DICustomField2: string | null;
    DICustomField3: string | null;
    DICustomField4: string | null;
    DICustomField5: string | null;
    DICustomField6: string | null;
    DICustomField7: string | null;
    DICustomField8: string | null;
    DICustomField9: string | null;
    DICustomField10: string | null;
    CreatedDate: string;
    CreatedBy: string;
    ModifiedDate: string | null;
    ModifiedBy: string | null;
    IsFollowSerialNumber: number;
    IsAllowDuplicateSerialNumber: number;
    WarrantyTime: number;
    BaseOnFormula: string | null;
    QuantityAvailable: number;
    InventoryCombo: string | null;
}
