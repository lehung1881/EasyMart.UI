import { DataType, FilterOperator } from "@/constants";

export const FilterNodeType = {
    Condition: 0,
    Group: 1,
} as const;
// Định nghĩa Type để truyền làm kiểu dữ liệu cho property
export type FilterNodeType = (typeof FilterNodeType)[keyof typeof FilterNodeType];

export const LogicalOperator = {
    And: 0,
    Or: 1,
} as const;
export type LogicalOperator = (typeof LogicalOperator)[keyof typeof LogicalOperator];

/**
 * Điều kiện sắp xếp - map với SortCondition (C#)
 */
export interface SortCondition {
    property: string;
    desc: boolean;
}

/**
 * Một node trong cây filter — có thể là điều kiện đơn hoặc nhóm lồng nhau.
 * Đã cấu trúc lại để map khớp 100% với class FilterCondition (C#).
 */
export interface FilterCondition {
    /** Xác định node hiện tại là điều kiện đơn hay một nhóm các điều kiện */
    NodeType: FilterNodeType;

    // ── Chỉ dùng khi NodeType = FilterNodeType.Condition ───────────────────
    /** Tên thuộc tính hoặc trường dữ liệu cần lọc (ví dụ: "age", "createdDate") */
    Property?: string | null;
    /** Giá trị dùng để so sánh */
    Value?: any;
    /** Toán tử so sánh (ví dụ: Equal, Contains) */
    Operator?: FilterOperator;
    /** Kiểu dữ liệu của thuộc tính */
    DataType?: DataType;

    // ── Chỉ dùng khi NodeType = FilterNodeType.Group ───────────────────────
    /** Toán tử logic để nối các điều kiện con (AND / OR) */
    LogicalOperator?: LogicalOperator;
    /** Danh sách các điều kiện con hoặc nhóm con lồng bên trong */
    Children?: FilterCondition[];
}

/**
 * Giá trị đang selected trong Combobox - map với SelectedValue (C#).
 * Dùng để ưu tiên bản ghi đang chọn lên đầu danh sách phân trang.
 */
export interface SelectedValue {
    property: string;
    value: any;
    dataType: DataType;
}

/**
 * Yêu cầu phân trang - map với PagingRequest (C#)
 */
export interface PagingRequest {
    Sort: SortCondition[];
    /** Cây điều kiện lọc (đã hỗ trợ cả đơn lẻ lẫn lồng nhau) */
    Filter?: FilterCondition | null;
    Columns: string;
    PageIndex: number;
    PageSize: number;
    ViewOrTableName: string;
    /** Giá trị đang selected trong Combobox, bản ghi này sẽ được ưu tiên lên đầu */
    SelectedValue?: SelectedValue | null;
}

/**
 * Kết quả phân trang - map với PagingResponse (C#)
 * BE trả về PageData dạng object (dynamic), UI dùng generic T để type-safe.
 */
export interface PagingResponse<T = Record<string, unknown>> {
    /** Dữ liệu của trang hiện tại */
    PageData: T[];
    /** Tổng số bản ghi thỏa mãn điều kiện */
    Total: number;
}
