/**
 * Danh sách cấu hình một số data đầu của các form.
 */
export const formConfig = [
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
