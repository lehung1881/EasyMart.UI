/**
 * Object chứa tất cả các hằng số của ứng dụng.
 */
export const Constant = {
    /**
     * ColumnType — Định nghĩa kiểu render/editor cho từng cột trong bảng.
     * Giá trị number giúp đồng bộ cấu hình giữa UI và backend.
     */
    ColumnType: {
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
    },

    /**
     * Enum định nghĩa các kiểu dữ liệu được hỗ trợ.
     * Map 1:1 với BE enum DataType (C#).
     */
    DataType: {
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
    },

    /**
     * Enum định nghĩa các toán tử so sánh dùng trong điều kiện lọc.
     * Map 1:1 với BE enum FilterOperator (C#).
     */
    FilterOperator: {
        /** Bằng (=) */
        Equal: 1,

        /** Không bằng (!=) */
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

        /** Nhỏ hơn hoặc bằng (<=) */
        LessThanOrEqual: 10,

        /** Lớn hơn (>) */
        GreaterThan: 11,

        /** Lớn hơn hoặc bằng (>=) */
        GreaterThanOrEqual: 12,

        /** Nằm trong danh sách giá trị (IN) */
        In: 13,

        /** Không nằm trong danh sách giá trị (NOT IN) */
        NotIn: 14,

        /** Nằm trong khoảng (BETWEEN) */
        Between: 15,
    },

    /**
     * FormatType — Định nghĩa kiểu format hiển thị dữ liệu trên grid/column.
     * Giá trị number mapping với BE trả về trong ColumnDefinition.formatType.
     */
    FormatType: {
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
    },

    /**
     * Enum định nghĩa trạng thái của Model khi tương tác với dữ liệu.
     */
    ModelState: {
        None: 0,
        Insert: 1,
        Update: 2,
        Delete: 3,
    },

    /**
     * Enum định nghĩa trạng thái của Form trên giao diện.
     */
    FormState: {
        Add: 0,
        Edit: 1,
    }
} as const;