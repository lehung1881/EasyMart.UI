import { ref, computed } from "vue";
import type { Ref } from "vue";
import SAOrder from "@/models/sales/SAOrder";
import SAOrderDetail from "@/models/sales/SAOrderDetail";
import { loadDataRemoteCombobox, useComboboxStore } from "@/composables/controls/useComboboxStore";
import CustomerApi from "@/api/modules/dictionary/customerAPI.ts";

interface InventoryItemSearchResult {
    InventoryItemID: string;
    InventoryItemCode: string;
    InventoryItemName: string;
    SellPrice: number;
    MinimumStock: number;
    ImageUrl: string | null;
}

/**
 * lvhung - 05.07.2026
 * Cung cấp toàn bộ thao tác CRUD và tính toán trên chi tiết đơn hàng POS.
 * Nhận activeOrder dưới dạng Ref để reactive với tab đang active.
 * @param activeOrder Ref tới đơn hàng đang được chọn trên POS.
 */
export function useOrderDetailActions(activeOrder: Ref<SAOrder | null>) {
    // #region STATE
    const selectedDetailID = ref<string | null>(null);
    // #endregion

    // #region COMPUTED
    /**
     * lvhung - 05.07.2026
     * Danh sách chi tiết hàng hóa của đơn hàng đang active.
     */
    const currentOrderDetails = computed(() => activeOrder.value?.SAOrderDetails ?? []);

    /**
     * lvhung - 05.07.2026
     * Tổng hợp số lượng và thành tiền của toàn bộ dòng trong đơn hàng hiện tại.
     */
    const orderSummary = computed(() => {
        return currentOrderDetails.value.reduce(
            (summary, detail) => {
                summary.totalQuantity += Number(detail.Quantity ?? 0);
                summary.totalAmount += Number(detail.Amount ?? 0);
                return summary;
            },
            { totalQuantity: 0, totalAmount: 0 },
        );
    });
    // #endregion

    // #region HELPERS
    /**
     * lvhung - 05.07.2026
     * Đồng bộ và trigger reactivity cho mảng chi tiết của đơn hàng hiện tại.
     * @param updatedDetails Mảng chi tiết hàng hóa đã được cập nhật.
     */
    function syncOrderDetails(updatedDetails: SAOrderDetail[]): void {
        if (!activeOrder.value) return;
        activeOrder.value.SAOrderDetails = updatedDetails;
    }
    // #endregion

    // #region ACTIONS
    /**
     * lvhung - 05.07.2026
     * Chọn một dòng chi tiết trong bảng hàng hóa.
     * @param refDetailID ID của dòng chi tiết cần chọn.
     */
    function selectOrderDetail(refDetailID: string): void {
        selectedDetailID.value = refDetailID;
    }

    /**
     * lvhung - 05.07.2026
     * Cập nhật số lượng của một mặt hàng trong đơn và tính lại thành tiền.
     * @param detail Đối tượng chi tiết hàng hóa cần cập nhật.
     * @param value Số lượng mới.
     */
    function updateItemQuantity(detail: SAOrderDetail, value: number | null): void {
        if (!activeOrder.value) return;
        const nextQuantity = Math.max(0, Number(value ?? 0));
        detail.Quantity = nextQuantity;
        detail.MainQuantity = nextQuantity;
        detail.Amount = Number(detail.UnitPrice ?? 0) * nextQuantity;
        syncOrderDetails([...(activeOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
    }

    /**
     * lvhung - 05.07.2026
     * Tăng số lượng mặt hàng lên 1 đơn vị.
     * @param detail Đối tượng chi tiết hàng hóa cần tăng số lượng.
     */
    function increaseItemQuantity(detail: SAOrderDetail): void {
        updateItemQuantity(detail, Number(detail.Quantity ?? 0) + 1);
    }

    /**
     * lvhung - 05.07.2026
     * Giảm số lượng mặt hàng đi 1 đơn vị. Nếu số lượng về 0 thì xóa dòng.
     * @param detail Đối tượng chi tiết hàng hóa cần giảm số lượng.
     */
    function decreaseItemQuantity(detail: SAOrderDetail): void {
        const currentQuantity = Number(detail.Quantity ?? 0);
        if (currentQuantity <= 1) {
            removeOrderDetail(detail.RefDetailID);
        } else {
            updateItemQuantity(detail, currentQuantity - 1);
        }
    }

    /**
     * lvhung - 05.07.2026
     * Cập nhật đơn giá của một mặt hàng và tính lại thành tiền.
     * @param detail Đối tượng chi tiết hàng hóa cần cập nhật.
     * @param value Giá trị đơn giá mới.
     */
    function updateItemUnitPrice(detail: SAOrderDetail, value: number | null): void {
        if (!activeOrder.value) return;
        const nextUnitPrice = Math.max(0, Number(value ?? 0));
        detail.UnitPrice = nextUnitPrice;
        detail.MainUnitPrice = nextUnitPrice;
        detail.Amount = nextUnitPrice * Number(detail.Quantity ?? 0);
        syncOrderDetails([...(activeOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
    }

    /**
     * lvhung - 05.07.2026
     * Cập nhật thành tiền của một mặt hàng và tính ngược lại đơn giá tương ứng.
     * @param detail Đối tượng chi tiết hàng hóa cần cập nhật.
     * @param value Giá trị thành tiền mới.
     */
    function updateItemAmount(detail: SAOrderDetail, value: number | null): void {
        if (!activeOrder.value) return;
        const nextAmount = Math.max(0, Number(value ?? 0));
        detail.Amount = nextAmount;
        const currentQuantity = Number(detail.Quantity ?? 0);
        if (currentQuantity > 0) {
            const nextUnitPrice = nextAmount / currentQuantity;
            detail.UnitPrice = nextUnitPrice;
            detail.MainUnitPrice = nextUnitPrice;
        }
        syncOrderDetails([...(activeOrder.value.SAOrderDetails ?? [])] as SAOrderDetail[]);
    }

    /**
     * lvhung - 05.07.2026
     * Xóa một dòng chi tiết đơn hàng theo ID.
     * Tự động reset selectedDetailID nếu dòng bị xóa đang được chọn.
     * @param refDetailID ID của dòng chi tiết cần xóa.
     */
    function removeOrderDetail(refDetailID: string): void {
        if (!activeOrder.value) return;
        const updatedDetails = [...(activeOrder.value.SAOrderDetails ?? [])].filter(
            (detail) => detail.RefDetailID !== refDetailID,
        );
        syncOrderDetails(updatedDetails as SAOrderDetail[]);
        if (selectedDetailID.value === refDetailID) {
            selectedDetailID.value = null;
        }
    }

    /**
     * lvhung - 05.07.2026
     * Xử lý chọn hàng hóa từ ô tìm kiếm.
     * Nếu isGroupRows=true và hàng đã tồn tại thì tăng số lượng, ngược lại thêm dòng mới.
     * @param inventoryItem Hàng hóa được chọn từ kết quả tìm kiếm.
     * @param isGroupRows Chế độ gộp dòng nếu cùng mặt hàng.
     */
    function handleSelectInventoryItem(inventoryItem: InventoryItemSearchResult, isGroupRows: boolean): void {
        if (!activeOrder.value) return;

        const detailList = [...(activeOrder.value.SAOrderDetails ?? [])];
        const existingDetail = isGroupRows
            ? detailList.find((detail) => detail.InventoryItemID === inventoryItem.InventoryItemID)
            : null;

        if (existingDetail) {
            existingDetail.Quantity = Number(existingDetail.Quantity ?? 0) + 1;
            existingDetail.MainQuantity = Number(existingDetail.MainQuantity ?? 0) + 1;
            existingDetail.Amount = Number(existingDetail.UnitPrice ?? 0) * Number(existingDetail.Quantity ?? 0);
        } else {
            const newDetail = new SAOrderDetail({
                InventoryItemID: inventoryItem.InventoryItemID,
                InventoryItemCode: inventoryItem.InventoryItemCode,
                InventoryItemName: inventoryItem.InventoryItemName,
                Quantity: 1,
                MainQuantity: 1,
                UnitPrice: inventoryItem.SellPrice,
                MainUnitPrice: inventoryItem.SellPrice,
                Amount: inventoryItem.SellPrice,
                SortOrder: detailList.length + 1,
            });
            newDetail.setAutoPrimaryKey();
            detailList.push(newDetail);
        }

        activeOrder.value.SAOrderDetails = detailList;
    }
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
    function handleCustomerChange(selectedItem: any): void {
        if (!activeOrder.value) return;
        activeOrder.value.CustomerCode = selectedItem?.CustomerCode ?? "";
        activeOrder.value.CustomerName = selectedItem?.CustomerName ?? "";
    }

    /**
     * lvhung - 05.07.2026
     * Định dạng chuỗi hiển thị cho khách hàng trong ô input combobox.
     * Format: "Mã - Tên - (SĐT)", bỏ qua SĐT nếu không có.
     * @param selectedItem Dữ liệu khách hàng đang được chọn.
     */
    function formatCustomerDisplayText(selectedItem: any): string {
        if (!selectedItem) return "";
        const displayParts = [selectedItem.CustomerCode, selectedItem.CustomerName];
        if (selectedItem.PhoneNumber) displayParts.push(`(${selectedItem.PhoneNumber})`);
        return displayParts.join(" - ");
    }
    // #endregion

    return {
        selectedDetailID,
        currentOrderDetails,
        orderSummary,
        selectOrderDetail,
        updateItemQuantity,
        increaseItemQuantity,
        decreaseItemQuantity,
        updateItemUnitPrice,
        updateItemAmount,
        removeOrderDetail,
        handleSelectInventoryItem,
        customerStore,
        handleCustomerChange,
        formatCustomerDisplayText,
    };
}
