/**
 * FormatType — Định nghĩa kiểu format hiển thị dữ liệu trên grid/column.
 * Giá trị number mapping với BE trả về trong ColumnDefinition.formatType.
 */
export const FormatType = {
    /** Hiển thị text thuần, không format */
    Text: 0,
    /** Tiền tệ: 1.234.567 (có dấu phân cách hàng nghìn, không thập phân) */
    Currency: 1,
    /** Số lượng: 1.234,56 (có dấu phân cách hàng nghìn + thập phân) */
    Quantity: 2,
    /** Ngày: 20/01/2023 (dd/MM/yyyy) */
    Date: 3,
    /** Ngày giờ: 20/03/2024 12:34 (dd/MM/yyyy HH:mm) */
    DateTime: 4,
    /** Checkbox: true/false */
    Checkbox: 5,
} as const;

/** Union type từ FormatType values */
export type FormatType = (typeof FormatType)[keyof typeof FormatType];
