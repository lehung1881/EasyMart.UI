import type { SAOrder } from "@/models/sales/SAOrder";
import type { SAOrderDetail } from "@/models/sales/SAOrderDetail";
import Decimal from "decimal.js";

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

class SAOrderCalculator {
    // #region SAOrderDetail

    /**
     * Tính và set MainQuantity và MainUnitPrice theo tỉ lệ quy đổi đơn vị tính.
     * MainQuantity  = Quantity * conversionRate
     * MainUnitPrice = UnitPrice / conversionRate
     *
     * @param detail Instance SAOrderDetail cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcMainUnit(detail: SAOrderDetail, options: any = {}): void {
        const rate = Number(detail.ExchangeRate || 1);
        const qty = Number(detail.Quantity ?? 0);
        const price = Number(detail.UnitPrice ?? 0);

        detail.MainQuantity = round(qty * rate, options.decimalPlaces);
        detail.MainUnitPrice = round(rate !== 0 ? price / rate : 0, options.decimalPlaces);
    }

    /**
     * Tính và set DiscountAmount trên dòng chi tiết.
     * DiscountAmount = UnitPrice * Quantity * DiscountRate / 100
     *
     * @param detail Instance SAOrderDetail cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcDiscountAmount(detail: SAOrderDetail, options: any = {}): void {
        const qty = Number(detail.Quantity ?? 0);
        const price = Number(detail.UnitPrice ?? 0);
        const discountRate = Number(detail.DiscountRate ?? 0);

        detail.DiscountAmount = round((price * qty * discountRate) / 100, options.decimalPlaces);
    }

    /**
     * Tính và set Amount (thành tiền) trên dòng chi tiết.
     * Amount = UnitPrice * Quantity - DiscountAmount
     * Yêu cầu DiscountAmount đã được tính trước.
     *
     * @param detail Instance SAOrderDetail cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcAmount(detail: SAOrderDetail, options: any = {}): void {
        const qty = Number(detail.Quantity ?? 0);
        const price = Number(detail.UnitPrice ?? 0);
        const discount = Number(detail.DiscountAmount ?? 0);

        detail.Amount = round(Math.max(0, price * qty - discount), options.decimalPlaces);
    }

    /**
     * Tính và set VatAmount trên dòng chi tiết.
     * VatAmount = Amount * VatRate / 100
     * Yêu cầu Amount đã được tính trước.
     *
     * @param detail Instance SAOrderDetail cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcVatAmount(detail: SAOrderDetail, options: any = {}): void {
        const amount = Number(detail.Amount ?? 0);
        const vatRate = Number(detail.VatRate ?? 0);

        detail.VatAmount = round((amount * vatRate) / 100, options.decimalPlaces);
    }

    /**
     * Tính toàn bộ các giá trị tiền tệ trên dòng chi tiết.
     * Thứ tự thực thi: DiscountAmount → Amount → VatAmount.
     * MainQuantity và MainUnitPrice cần gọi calcMainUnit riêng khi có conversionRate.
     *
     * @param detail Instance SAOrderDetail cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calculateDetailAmounts(detail: SAOrderDetail, options: any = {}): void {
        this.calcDiscountAmount(detail, options);
        this.calcAmount(detail, options);
        this.calcVatAmount(detail, options);
    }

    // #endregion

    // #region SAOrder

    /**
     * Tính và set SubTotalAmount từ danh sách chi tiết đơn hàng.
     * SubTotalAmount = sum(detail.Amount)
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcSubTotalAmount(order: SAOrder, options: any = {}): void {
        const details = order.SAOrderDetails ?? [];
        const subTotal = details.reduce((sum, detail) => sum + Number(detail.Amount ?? 0), 0);
        order.SubTotalAmount = round(subTotal, options.decimalPlaces);
    }

    /**
     * Tính và set TotalAmount sau giảm giá và thuế.
     * TotalAmount = max(0, SubTotalAmount - DiscountAmount + TaxAmount)
     * Yêu cầu SubTotalAmount đã được tính trước.
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcTotalAmount(order: SAOrder, options: any = {}): void {
        const subTotal = Number(order.SubTotalAmount ?? 0);
        const discount = Math.max(0, Number(order.DiscountAmount ?? 0));
        const tax = Number(order.TaxAmount ?? 0);

        order.DiscountAmount = round(discount, options.decimalPlaces);
        order.TotalAmount = round(Math.max(0, subTotal - discount + tax), options.decimalPlaces);
    }

    /**
     * Tính và set ChangeAmount (tiền thối lại cho khách).
     * ChangeAmount = max(0, PaidAmount - TotalAmount)
     * Yêu cầu TotalAmount đã được tính trước.
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calcChangeAmount(order: SAOrder, options: any = {}): void {
        const paid = Math.max(0, Number(order.PaidAmount ?? 0));

        order.PaidAmount = round(paid, options.decimalPlaces);
        order.ChangeAmount = round(Math.max(0, paid - Number(order.TotalAmount ?? 0)), options.decimalPlaces);
    }

    /**
     * Tính toàn bộ các giá trị tiền tệ trên master đơn hàng và set trực tiếp lên instance SAOrder.
     * Thứ tự thực thi: SubTotalAmount → TotalAmount → ChangeAmount.
     *
     * @param order Instance SAOrder cần cập nhật.
     * @param options Tuỳ chọn tính toán.
     */
    calculateAmounts(order: SAOrder, options: any = {}): void {
        this.calcSubTotalAmount(order, options);
        this.calcTotalAmount(order, options);
        this.calcChangeAmount(order, options);
    }

    // #endregion
}

export default new SAOrderCalculator();
