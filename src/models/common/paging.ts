import { DataType } from "@/constants/enums/dataType.ts";
import { FilterOperator } from "@/constants/enums/filterOperator.ts";

/**
 * Điều kiện sắp xếp - map với SortCondition (C#)
 */
export interface SortCondition {
    property: string;
    desc: boolean;
    // dataType: DataType;
    // operand: number;
}

/**
 * Điều kiện lọc - map với FilterCondition (C#)
 */
export interface FilterCondition {
    property: string;
    value: any;
    operator: FilterOperator;
    operand: number;
    dataType: DataType;
}

/**
 * Giá trị đang selected trong Combobox - map với SelectedValue (C#)
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
    sort: SortCondition[];
    filter: FilterCondition[];
    columns: string;
    pageIndex: number;
    pageSize: number;
    viewOrTableName: string;
    /** Giá trị đang selected trong Combobox, bản ghi này sẽ được ưu tiên lên đầu */
    selectedValue?: SelectedValue | null;
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
