/**
 * Form config
 */
export interface FormConfig {
    FormID: string;
    Name: string;
    RefType: number;
    DetailFormID?: string;
    ModelKeyID?: string;
}

/**
 * Danh sách cấu hình một số data đầu của các form.
 */
export const formConfig: FormConfig[] = [
    {
        FormID: "InventoryItemList",
        DetailFormID: "InventoryItemDetail",
        Name: "Danh sách hàng hóa",
        RefType: 100,
        ModelKeyID: "InventoryItemID",
    },
    {
        FormID: "InventoryItemDetail",
        Name: "Chi tiết hàng hóa",
        RefType: 110,
        ModelKeyID: "InventoryItemID",
    },
    {
        FormID: "StockList",
        DetailFormID: "StockDetail",
        Name: "Kho",
        RefType: 120,
    },
];

/**
 * Cập nhật lại Map để nó hiểu key truyền vào BẮT BUỘC phải thuộc FormIDKeys
 */
export const formConfigMap = new Map<string, FormConfig>(formConfig.map((item) => [item.FormID, item]));
