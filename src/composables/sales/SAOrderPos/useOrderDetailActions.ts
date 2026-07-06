import { ref, computed } from "vue";
import type { Ref } from "vue";
import SAOrder from "@/models/sales/SAOrder";
import SAOrderDetail from "@/models/sales/SAOrderDetail";
import { loadDataRemoteCombobox, useComboboxStore } from "@/composables/controls/useComboboxStore";
import CustomerApi from "@/api/modules/dictionary/customerAPI.ts";
import type { OrderTab } from "./useOrderTabManager";
import SAOrderCalculator from "@/utils/CalcSaOrder.ts";
import unitAPI from "@/api/modules/dictionary/unitAPI";
/**
 * lvhung - 05.07.2026
 * Cung cấp toàn bộ thao tác CRUD và tính toán trên chi tiết đơn hàng POS.
 * Nhận activeOrder dưới dạng Ref để reactive với tab đang active.
 * @param activeOrder Ref tới đơn hàng đang được chọn trên POS.
 * @param activeTab Ref tới tab đang được chọn.
 */
export const useOrderDetailActions = (activeOrder: Ref<SAOrder | null>, activeTab: Ref<OrderTab>) => {
    // #region STATE
    const selectedDetailID = ref<string | null>(null);
    // #endregion

    // #region COMPUTED
    /**
     * lvhung - 05.07.2026
     * Danh sách chi tiết hàng hóa của đơn hàng đang active.
     */
    const currentOrderDetails = computed(() => activeOrder.value?.SAOrderDetails ?? []);

    // #endregion

    // #region HELPERS
    /**
     * lvhung - 05.07.2026
     * Đồng bộ và trigger reactivity cho mảng chi tiết của đơn hàng hiện tại.
     * @param updatedDetails Mảng chi tiết hàng hóa đã được cập nhật.
     */
    const syncOrderDetails = (updatedDetails: SAOrderDetail[]): void => {
        if (!activeOrder.value) return;
        activeOrder.value.SAOrderDetails = updatedDetails;
    };

    /**
     * Đồng bộ lại toàn bộ tổng tiền trên master đơn hàng.
     * Dùng model `SAOrder.calculateTotals()` để đảm bảo cùng một nguồn logic.
     */
    const calculateMasterTotal = (): void => {
        if (!activeOrder.value) return;
        SAOrderCalculator.calculateAmounts(activeOrder.value);
    };
    // #endregion

    // #region ACTIONS
    /**
     * lvhung - 05.07.2026
     * Chọn một dòng chi tiết trong bảng hàng hóa.
     * @param refDetailID ID của dòng chi tiết cần chọn.
     */
    const selectOrderDetail = (refDetailID: string): void => {
        selectedDetailID.value = refDetailID;
    };

    /**
     * lvhung - 05.07.2026
     * Tăng số lượng mặt hàng lên 1 đơn vị.
     * @param detail Đối tượng chi tiết hàng hóa cần tăng số lượng.
     */
    const increaseItemQuantity = (detail: SAOrderDetail): void => {
        detail.Quantity = Number(detail.Quantity ?? 0) + 1;
        changeDetailOrder("quantity", detail);
    };

    /**
     * lvhung - 05.07.2026
     * Giảm số lượng mặt hàng đi 1 đơn vị. Nếu số lượng về 0 thì xóa dòng.
     * @param detail Đối tượng chi tiết hàng hóa cần giảm số lượng.
     */
    const decreaseItemQuantity = (detail: SAOrderDetail): void => {
        const currentQuantity = Number(detail.Quantity ?? 0);
        if (currentQuantity <= 1) {
            removeOrderDetail(detail.RefDetailID);
        } else {
            detail.Quantity = currentQuantity - 1;
            changeDetailOrder("quantity", detail);
        }
    };

    /**
     * lvhung - 05.07.2026
     * Xóa một dòng chi tiết đơn hàng theo ID.
     * Tự động reset selectedDetailID nếu dòng bị xóa đang được chọn.
     * @param refDetailID ID của dòng chi tiết cần xóa.
     */
    const removeOrderDetail = (refDetailID: string): void => {
        if (!activeOrder.value) return;
        const updatedDetails = [...(activeOrder.value.SAOrderDetails ?? [])].filter(
            (detail) => detail.RefDetailID !== refDetailID,
        );
        syncOrderDetails(updatedDetails as SAOrderDetail[]);
        calculateMasterTotal();
        if (selectedDetailID.value === refDetailID) {
            selectedDetailID.value = null;
        }
    };

    /**
     * lvhung - 06.07.2026
     * Xử lý tính toán lại dòng chi tiết khi người dùng thay đổi giá trị trên lưới.
     * Sau khi tính xong detail sẽ sync lại master totals.
     * @param columnName Tên cột vừa thay đổi.
     * @param detail Dòng chi tiết cần tính toán lại.
     */
    const changeDetailOrder = (columnName: string, detail: SAOrderDetail, metaData: any = null): void => {
        if (!activeOrder.value) return;

        switch (columnName) {
            case "unit":
                SAOrderCalculator.calcMainUnit(detail);
                SAOrderCalculator.calcDiscountAmount(detail);
                SAOrderCalculator.calcAmount(detail);
                SAOrderCalculator.calcVatAmount(detail);
                break;

            case "quantity":
            case "unit-price":
                SAOrderCalculator.calcMainUnit(detail);
                SAOrderCalculator.calcDiscountAmount(detail);
                SAOrderCalculator.calcAmount(detail);
                SAOrderCalculator.calcVatAmount(detail);
                break;

            case "discount-rate":
                SAOrderCalculator.calcDiscountAmount(detail);
                SAOrderCalculator.calcAmount(detail);
                SAOrderCalculator.calcVatAmount(detail);
                break;

            case "amount": {
                const qty = Number(detail.Quantity ?? 0);
                const amount = Number(detail.Amount ?? 0);
                detail.UnitPrice = qty !== 0 ? amount / qty : 0;
                detail.DiscountAmount = 0;
                detail.DiscountRate = 0;
                SAOrderCalculator.calcMainUnit(detail);
                SAOrderCalculator.calcVatAmount(detail);
                break;
            }
        }

        //syncOrderDetails([...(activeOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
        calculateMasterTotal();
    };

    /**
     * lvhung - 05.07.2026
     * Xử lý chọn hàng hóa từ ô tìm kiếm.
     * Nếu isGroupRows=true và hàng đã tồn tại thì tăng số lượng, ngược lại thêm dòng mới.
     * @param inventoryItem Hàng hóa được chọn từ kết quả tìm kiếm.
     * @param isGroupRows Chế độ gộp dòng nếu cùng mặt hàng.
     */
    const handleSelectInventoryItem = (inventoryItem: any, isGroupRows: boolean): void => {
        if (!activeOrder.value) return;

        const detailList = [...(activeOrder.value.SAOrderDetails ?? [])];
        const existingDetail = isGroupRows
            ? detailList.find((detail) => detail.InventoryItemID === inventoryItem.InventoryItemID)
            : null;

        if (existingDetail) {
            existingDetail.Quantity = Number(existingDetail.Quantity ?? 0) + 1;
            SAOrderCalculator.calcMainUnit(existingDetail);
            SAOrderCalculator.calcDiscountAmount(existingDetail);
            SAOrderCalculator.calcAmount(existingDetail);
            SAOrderCalculator.calcVatAmount(existingDetail);
        } else {
            const newDetail = new SAOrderDetail({
                InventoryItemID: inventoryItem.InventoryItemID,
                InventoryItemCode: inventoryItem.InventoryItemCode,
                InventoryItemName: inventoryItem.InventoryItemName,
                UnitID: inventoryItem.UnitID,
                UnitName: inventoryItem.UnitName,
                MainUnitID: inventoryItem.UnitID,
                MainUnitName: inventoryItem.UnitName,
                UnitPrice: inventoryItem.SellPrice,
                ExchangeRate: 1,
                ExchangeRateOperator: "*",
                Quantity: 1,
                SortOrder: detailList.length + 1,
            });
            newDetail.setAutoPrimaryKey();
            SAOrderCalculator.calculateDetailAmounts(newDetail);
            detailList.push(newDetail);
            activeOrder.value.SAOrderDetails = detailList;
        }

        calculateMasterTotal();
    };

    /**
     * lvhung - 05.07.2026
     * Thay đổi loại chiết khấu (theo phần trăm hoặc theo số tiền) cho tab hiện tại.
     * @param type Loại chiết khấu ('percent' hoặc 'amount')
     */
    const chooseDiscount = (type: "percent" | "amount", subtotal: number): void => {
        activeTab.value.discountType = type;
        if (type === "percent") {
            activeTab.value.discountValue = Math.min(Math.max(activeTab.value.discountValue, 0), 100);
        }
        if (!activeOrder.value) return;
        if (activeTab.value.discountType === "percent") {
            activeOrder.value.DiscountAmount = Math.round((subtotal * activeTab.value.discountValue) / 100);
        } else {
            activeOrder.value.DiscountAmount = activeTab.value.discountValue;
        }
        calculateMasterTotal();
    };

    /**
     * Cập nhật giá trị giảm giá từ input và tính lại tiền trên master.
     * @param value Giá trị giảm giá mới.
     */
    const updateDiscountValue = (value: number | null): void => {
        activeTab.value.discountValue = Math.max(0, Number(value ?? 0));
        if (!activeOrder.value) return;
        const subtotal = currentOrderDetails.value.reduce((sum, detail) => sum + Number(detail.Amount ?? 0), 0);
        if (activeTab.value.discountType === "percent") {
            activeOrder.value.DiscountAmount = Math.round((subtotal * activeTab.value.discountValue) / 100);
        } else {
            activeOrder.value.DiscountAmount = activeTab.value.discountValue;
        }
        calculateMasterTotal();
    };

    /**
     * Cập nhật số tiền khách trả và tính lại tiền thừa.
     * @param value Số tiền khách đưa.
     */
    const updatePaidAmount = (value: number | null): void => {
        if (!activeOrder.value) return;
        activeOrder.value.PaidAmount = Math.max(0, Number(value ?? 0));
        calculateMasterTotal();
    };
    // #endregion

    // #region CUSTOMER COMBOBOX
    const customerStore = useComboboxStore("sa_customer", {
        viewOrTableName: "di_customer",
        comboboxLoadData: (payload) => loadDataRemoteCombobox(CustomerApi, payload),
        displayField: "CustomerCode",
        valueField: "CustomerID",
        searchFields: ["CustomerCode", "CustomerName", "PhoneNumber"],
    });

    /**
     * lvhung - 05.07.2026
     * Xử lý khi người dùng chọn khách hàng từ combobox.
     * Đồng bộ CustomerCode và CustomerName vào đơn hàng đang active.
     * @param selectedItem Dữ liệu khách hàng được chọn từ combobox.
     */
    const handleCustomerChange = (selectedItem: any): void => {
        if (!activeOrder.value) return;
        activeOrder.value.CustomerCode = selectedItem?.CustomerCode ?? "";
        activeOrder.value.CustomerName = selectedItem?.CustomerName ?? "";
    };

    /**
     * lvhung - 05.07.2026
     * Định dạng chuỗi hiển thị cho khách hàng trong ô input combobox.
     * Format: "Mã - Tên - (SĐT)", bỏ qua SĐT nếu không có.
     * @param selectedItem Dữ liệu khách hàng đang được chọn.
     */
    const formatCustomerDisplayText = (selectedItem: any): string => {
        if (!selectedItem) return "";
        const displayParts = [selectedItem.CustomerCode, selectedItem.CustomerName];
        if (selectedItem.PhoneNumber) displayParts.push(`(${selectedItem.PhoneNumber})`);
        return displayParts.join(" - ");
    };
    // #endregion

    // #region CASHIER COMBOBOX
    const cashierStore = useComboboxStore("sa_cashier", {
        viewOrTableName: "di_cashier",
        comboboxLoadData: (payload) => loadDataRemoteCombobox(CustomerApi, payload),
        displayField: "CashierName",
        valueField: "CashierID",
        searchFields: ["CashierCode", "CashierName"],
    });

    /**
     * lvhung - 05.07.2026
     * Xử lý khi người dùng chọn nhân viên thu ngân từ combobox.
     * Đồng bộ CashierID và CashierName vào đơn hàng đang active.
     * @param selectedItem Dữ liệu nhân viên thu ngân được chọn từ combobox.
     */
    const handleCashierChange = (selectedItem: any): void => {
        if (!activeOrder.value) return;
        activeOrder.value.CashierID = selectedItem?.CashierID ?? null;
        activeOrder.value.CashierName = selectedItem?.CashierName ?? "";
    };
    // #endregion

    /**
     * Store cho combobox đơn vị tính
     */
    const unitStore = useComboboxStore("unit_combobox", {
        viewOrTableName: "di_unit",
        displayField: "UnitName",
        valueField: "UnitID",
        queryMode: "local",
        customLocalData: (rawData: any, options: any) => {
            if (options && options.dataRow) {
                const currentRow = options.dataRow;
                return [{ UnitID: currentRow.UnitID, UnitName: currentRow.UnitName }];
            }
            return rawData;
        },
    });
    return {
        unitStore,
        selectedDetailID,
        currentOrderDetails,
        selectOrderDetail,
        increaseItemQuantity,
        decreaseItemQuantity,
        removeOrderDetail,
        handleSelectInventoryItem,
        customerStore,
        handleCustomerChange,
        formatCustomerDisplayText,
        cashierStore,
        handleCashierChange,
        chooseDiscount,
        updateDiscountValue,
        updatePaidAmount,
        calculateMasterTotal,
        changeDetailOrder,
    };
};
