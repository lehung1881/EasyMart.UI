import type { SAOrder } from "@/models/sales/SAOrder";
import Decimal from "decimal.js";

/**
 * Làm tròn số theo số chữ số thập phân truyền vào.
 * - Với số có phần nguyên + thập phân <= 15 chữ số: dùng toFixed (đủ chính xác với IEEE 754).
 * - Với số lớn hơn: dùng Decimal.js để tránh mất độ chính xác.
 *
 * @param value Giá trị cần làm tròn.
 * @param decimalPlaces Số chữ số thập phân sau dấu phẩy.
 */
const round = (value: number, decimalPlaces?: number): number => {
    if (decimalPlaces === undefined) return value;

    const valueString = value != null ? value.toString() : "0";
    const dotIndex = valueString.replace(",", ".").indexOf(".");
    const integerPartLength = dotIndex < 0 ? valueString.length : dotIndex;

    if (integerPartLength + decimalPlaces <= 15) {
        return parseFloat(value.toFixed(decimalPlaces));
    }

    return parseFloat(new Decimal(value).toFixed(decimalPlaces));
};

export const CalcSAOrder = {
    /**
     * Tính và set SubTotalAmount từ danh sách chi tiết đơn hàng.
     * SubTotalAmount = sum(detail.Amount)
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcSubTotalAmount: (order: SAOrder, options: any = {}): void => {
        const details = order.SAOrderDetails ?? [];
        const subTotal = details.reduce((sum, detail) => sum + Number(detail.Amount ?? 0), 0);
        order.SubTotalAmount = round(subTotal, options.decimalPlaces);
    },

    /**
     * Tính và set TotalAmount sau giảm giá và thuế.
     * TotalAmount = max(0, SubTotalAmount - DiscountAmount + TaxAmount)
     * Yêu cầu SubTotalAmount đã được tính trước.
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcTotalAmount: (order: SAOrder, options: any = {}): void => {
        const subTotal = Number(order.SubTotalAmount ?? 0);
        const discount = Math.max(0, Number(order.DiscountAmount ?? 0));
        const tax = Number(order.TaxAmount ?? 0);

        order.DiscountAmount = round(discount, options.decimalPlaces);
        order.TotalAmount = round(Math.max(0, subTotal - discount + tax), options.decimalPlaces);
    },

    /**
     * Tính và set ChangeAmount (tiền thối lại cho khách).
     * ChangeAmount = max(0, PaidAmount - TotalAmount)
     * Yêu cầu TotalAmount đã được tính trước.
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcChangeAmount: (order: SAOrder, options: any = {}): void => {
        const paid = Math.max(0, Number(order.PaidAmount ?? 0));

        order.PaidAmount = round(paid, options.decimalPlaces);
        order.ChangeAmount = round(Math.max(0, paid - Number(order.TotalAmount ?? 0)), options.decimalPlaces);
    },

    /**
     * Tính toàn bộ các giá trị tiền tệ và set trực tiếp lên instance SAOrder.
     * Thứ tự thực thi: SubTotalAmount → TotalAmount → ChangeAmount.
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calculateAmounts: (order: SAOrder, options: any = {}): void => {
        CalcSAOrder.calcSubTotalAmount(order, options);
        CalcSAOrder.calcTotalAmount(order, options);
        CalcSAOrder.calcChangeAmount(order, options);
    },
};