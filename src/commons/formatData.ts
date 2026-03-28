/**
 * format.ts
 * Utility class xử lý format hiển thị dữ liệu theo FormatType.
 * Mỗi FormatType có một hàm format riêng, gọi thông qua formatDisplayData().
 */

import { FormatType, type FormatTypeType } from "@/constants";

class FormatData {
    /**
     * Format giá trị theo FormatType tương ứng.
     * Entry point chính - dispatch sang từng hàm format riêng.
     * @param value Giá trị raw từ data.
     * @param formatType Kiểu format cần áp dụng.
     * @returns Chuỗi đã format để hiển thị.
     */
    formatDisplayData(value: any, formatType: FormatTypeType): string {
        if (value == null || value === "") return "";

        switch (formatType) {
            case FormatType.Text:
                return this.formatText(value);
            case FormatType.Currency:
                return this.formatCurrency(value);
            case FormatType.Quantity:
                return this.formatQuantity(value);
            case FormatType.Date:
                return this.formatDate(value);
            case FormatType.DateTime:
                return this.formatDateTime(value);
            case FormatType.Checkbox:
                return this.formatCheckbox(value);
            default:
                return String(value);
        }
    }

    /**
     * Format text thuần - không xử lý đặc biệt.
     * @param value Giá trị cần format.
     * @returns Chuỗi text.
     */
    formatText(value: any): string {
        return String(value);
    }

    /**
     * Format tiền tệ - có dấu phân cách hàng nghìn, không thập phân.
     * Ví dụ: 1234567 → "1.234.567"
     * @param value Giá trị số cần format.
     * @returns Chuỗi tiền tệ đã format.
     */
    formatCurrency(value: any): string {
        const num = Number(value);
        if (isNaN(num)) return String(value);

        return num.toLocaleString("vi-VN", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        });
    }

    /**
     * Format số lượng - có dấu phân cách hàng nghìn + 2 chữ số thập phân.
     * Ví dụ: 1234.5 → "1.234,50"
     * @param value Giá trị số cần format.
     * @returns Chuỗi số lượng đã format.
     */
    formatQuantity(value: any): string {
        const num = Number(value);
        if (isNaN(num)) return String(value);

        return num.toLocaleString("vi-VN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    /**
     * Format ngày - dd/MM/yyyy.
     * Ví dụ: "2023-01-20" → "20/01/2023"
     * @param value Giá trị ngày (string ISO hoặc Date).
     * @returns Chuỗi ngày đã format.
     */
    formatDate(value: any): string {
        const d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) return String(value);

        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();

        return `${dd}/${mm}/${yyyy}`;
    }

    /**
     * Format ngày giờ - dd/MM/yyyy HH:mm.
     * Ví dụ: "2024-03-20T12:34:00" → "20/03/2024 12:34"
     * @param value Giá trị ngày giờ (string ISO hoặc Date).
     * @returns Chuỗi ngày giờ đã format.
     */
    formatDateTime(value: any): string {
        const d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) return String(value);

        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const mi = String(d.getMinutes()).padStart(2, "0");

        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    }

    /**
     * Format checkbox - true/1/"true" → "✓", còn lại → "✗".
     * @param value Giá trị boolean/number/string.
     * @returns "✓" hoặc "✗".
     */
    formatCheckbox(value: any): string {
        return value === true || value === 1 || value === "true" ? "✓" : "✗";
    }
}

/** Singleton instance - dùng chung toàn app */
export const formatData = new FormatData();
