/**
 * ColumnType — Định nghĩa kiểu render/editor cho từng cột trong bảng.
 * Giá trị number giúp đồng bộ cấu hình giữa UI và backend.
 */
export const ColumnType = {
    /** Cột chỉ hiển thị, không render editor */
    Text: 0,
    /** Editor nhập văn bản */
    Input: 1,
    /** Editor nhập số */
    InputNumber: 2,
    /** Editor checkbox */
    Checkbox: 3,
    /** Editor combobox */
    Combobox: 4,
    /** Editor chọn ngày */
    DatePicker: 5,
} as const;

/** Union type từ ColumnType values */
export type ColumnType = (typeof ColumnType)[keyof typeof ColumnType];
