/**
 * Form config
 */
export interface FormConfig {
    FormID: string;
    Name: string;
    RefType: number;
}

/**
 * Danh sách cấu hình một số data đầu của các form.
 */
export const formConfig: FormConfig[] = [
    {
        FormID: "InventoryItemList",
        Name: "Hàng hóa",
        RefType: 100,
    },
    {
        FormID: "StockList",
        Name: "Kho",
        RefType: 110,
    },
];

/**
 * Map tra cứu nhanh config theo Code.
 */
export const formConfigMap = new Map(formConfig.map((item) => [item.FormID, item]));
