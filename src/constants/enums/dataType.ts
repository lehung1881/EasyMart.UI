/**
 * Enum định nghĩa các kiểu dữ liệu được hỗ trợ.
 * Map 1:1 với BE enum DataType (C#).
 */
export const DataType = {
    /** Kiểu chuỗi ký tự */
    String: 1,

    /** Kiểu số (int, float, decimal,...) */
    Number: 2,

    /** Kiểu ngày giờ */
    DateTime: 3,

    /** Kiểu boolean (true/false) */
    Boolean: 4,

    /** Kiểu GUID / UUID */
    Guid: 5,

    /** Kiểu chỉ ngày (yyyy-MM-dd), không bao gồm giờ phút giây */
    Date: 6,
} as const;

export type DataType = (typeof DataType)[keyof typeof DataType];
