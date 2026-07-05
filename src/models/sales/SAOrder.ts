import BaseModel, { type BaseFieldConfig } from "@/models/common/baseModel";
import SAOrderDetail from "@/models/sales/SAOrderDetail";

/**
 * Model master đơn hàng bán.
 */
export class SAOrder extends BaseModel {
    /** Khóa chính đơn hàng. */
    declare RefID: string;

    /** Số đơn hàng. */
    declare RefNo: string;

    /** Số đơn hàng hiển thị trên giao diện. */
    declare RefNoText: string;

    /** Ngày lập đơn hàng. */
    declare RefDate: string;

    /** ID khách hàng. */
    declare CustomerID: string | null;

    /** Mã khách hàng snapshot. */
    declare CustomerCode: string | null;

    /** Tên khách hàng snapshot. */
    declare CustomerName: string | null;

    /** ID nhân viên thu ngân lập đơn. */
    declare CashierID: string | null;

    /** Tên nhân viên thu ngân lập đơn. */
    declare CashierName: string;

    /** ID kho xuất hàng. */
    declare StockID: string;

    /** Mã kho snapshot. */
    declare StockCode: string;

    /** Tên kho snapshot. */
    declare StockName: string;

    /** Tổng tiền hàng trước giảm giá và VAT. */
    declare SubTotalAmount: number;

    /** Số tiền giảm giá trên tổng đơn. */
    declare DiscountAmount: number;

    /** Tiền VAT. */
    declare TaxAmount: number;

    /** Tổng tiền phải thanh toán. */
    declare TotalAmount: number;

    /** Số tiền khách đã trả. */
    declare PaidAmount: number;

    /** Tiền thối lại cho khách. */
    declare ChangeAmount: number;

    /** Hình thức thanh toán. */
    declare PaymentMethod: number;

    /** Trạng thái đơn. */
    declare OrderStatus: number;

    /** Ghi chú đơn hàng. */
    declare Description: string | null;

    /** Ngày tạo bản ghi. */
    declare CreatedDate: string | null;

    /** Người tạo bản ghi. */
    declare CreatedBy: string | null;

    /** Ngày sửa bản ghi gần nhất. */
    declare ModifiedDate: string | null;

    /** Người sửa bản ghi gần nhất. */
    declare ModifiedBy: string | null;

    /** Danh sách chi tiết đơn hàng. */
    declare SAOrderDetails: SAOrderDetail[];

    /**
     * Tính lại các giá trị tổng hợp trên master đơn hàng từ danh sách chi tiết.
     * - SubTotalAmount: tổng `Amount` của các dòng chi tiết
     * - TotalAmount: SubTotalAmount - DiscountAmount + TaxAmount
     * - ChangeAmount: số tiền trả lại = PaidAmount - TotalAmount
     *
     * @param discountAmount Số tiền giảm giá áp dụng lên master. Nếu truyền vào sẽ đồng bộ vào model.
     * @param paidAmount Số tiền khách đã trả. Nếu truyền vào sẽ đồng bộ vào model.
     * @returns Chính instance hiện tại để có thể chain nếu cần.
     */
    calculateTotals(): this {
        const details = this.SAOrderDetails ?? [];
        const subtotal = details.reduce((sum, detail) => sum + Number(detail.Amount ?? 0), 0);
        const discount = Number(this.DiscountAmount ?? 0);
        const tax = Number(this.TaxAmount ?? 0);
        const paid = Number(this.PaidAmount ?? 0);
        const total = Math.max(0, subtotal - discount + tax);

        this.SubTotalAmount = subtotal;
        this.DiscountAmount = Math.max(0, discount);
        this.TotalAmount = total;
        this.PaidAmount = Math.max(0, paid);
        this.ChangeAmount = Math.max(0, this.PaidAmount - total);

        return this;
    }

    constructor(data?: Partial<SAOrder>, options: unknown = null) {
        super(data as Record<string, unknown> | undefined, options);
    }
}

SAOrder.prototype._fields = [
    { name: "RefID", dataType: "string", defaultValue: null, isPrimaryKey: true },
    { name: "RefNo", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "RefNoText", dataType: "string", defaultValue: null, ignoreCheckChange: true },
    { name: "RefDate", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "CustomerID", dataType: "string", defaultValue: null },
    { name: "CustomerCode", dataType: "string", defaultValue: null },
    { name: "CustomerName", dataType: "string", defaultValue: null },
    { name: "CashierID", dataType: "string", defaultValue: null },
    { name: "CashierName", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "StockID", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "StockCode", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "StockName", dataType: "string", defaultValue: null, validateRules: [{ type: "NotNull" }] },
    { name: "SubTotalAmount", dataType: "number", defaultValue: 0 },
    { name: "DiscountAmount", dataType: "number", defaultValue: 0 },
    { name: "TaxAmount", dataType: "number", defaultValue: 0 },
    { name: "TotalAmount", dataType: "number", defaultValue: 0 },
    { name: "PaidAmount", dataType: "number", defaultValue: 0 },
    { name: "ChangeAmount", dataType: "number", defaultValue: 0 },
    { name: "PaymentMethod", dataType: "number", defaultValue: 1, validateRules: [{ type: "NotNull" }] },
    { name: "OrderStatus", dataType: "number", defaultValue: 1, validateRules: [{ type: "NotNull" }] },
    { name: "Description", dataType: "string", defaultValue: null },
    { name: "CreatedDate", dataType: "string", defaultValue: null },
    { name: "CreatedBy", dataType: "string", defaultValue: null },
    { name: "ModifiedDate", dataType: "string", defaultValue: null },
    { name: "ModifiedBy", dataType: "string", defaultValue: null },
    { name: "SAOrderDetails", dataType: "array", defaultValue: [], isDetail: true, detailModel: SAOrderDetail },
] as BaseFieldConfig[];

export default SAOrder;
