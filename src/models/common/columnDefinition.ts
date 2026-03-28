import type { FormatTypeType } from "@/constants";

export interface ColumnDefinition {
    /** Khóa cột (0 = không khóa) */
    lock?: number;
    /** Loại cột (nullable) */
    type?: string | null;
    /** Tiêu đề hiển thị */
    title?: string;
    /** Chiều rộng cột (px, %, auto...) */
    width?: number | string;
    /** Canh lề nội dung cột */
    align?: "left" | "center" | "right";
    /** Tooltip khi hover */
    tooltip?: string;
    /** Hiển thị cột hay không */
    visible?: boolean;
    /** Tên field dữ liệu mapping */
    dataField: string;
    /** Thứ tự sắp xếp */
    sortOrder?: number;
    /** Tự động resize (0 = không) */
    autoResize?: number;
    /** Định nghĩa tile hiển thị */
    tileDefinition?: string;
    /** Loại format dữ liệu */
    formatType?: FormatTypeType;
    /** Loại component render cột */
    columnType?: string;
}
