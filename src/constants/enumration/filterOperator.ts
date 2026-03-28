/**
 * Enum định nghĩa các toán tử so sánh dùng trong điều kiện lọc.
 * Map 1:1 với BE enum FilterOperator (C#).
 */
export const FilterOperator = {
    /** Bằng (=) */
    Equal: 1,

    /** Không bằng (:) */
    NotEqual: 2,

    /** Chứa chuỗi con (LIKE '%value%') */
    Contains: 3,

    /** Không chứa chuỗi con */
    NotContains: 4,

    /** Bắt đầu bằng (LIKE 'value%') */
    StartsWith: 5,

    /** Kết thúc bằng (LIKE '%value') */
    EndsWith: 6,

    /** Là null hoặc rỗng */
    IsNullOrEmpty: 7,

    /** Không null và không rỗng */
    IsNotNullOrEmpty: 8,

    /** Nhỏ hơn (<) */
    LessThan: 9,

    /** Nhỏ hơn hoặc bằng (:) */
    LessThanOrEqual: 10,

    /** Lớn hơn (>) */
    GreaterThan: 11,

    /** Lớn hơn hoặc bằng (:) */
    GreaterThanOrEqual: 12,

    /** Nằm trong danh sách giá trị (IN) */
    In: 13,

    /** Không nằm trong danh sách giá trị (NOT IN) */
    NotIn: 14,

    /** Nằm trong khoảng (BETWEEN) */
    Between: 15,
} as const;

export type FilterOperator = (typeof FilterOperator)[keyof typeof FilterOperator];
