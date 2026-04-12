/**
 * useBaseList.ts
 * Business logic layer - Composable factory cho màn hình danh sách với CRUD operations.
 * Layer này nằm trên useTableStore, xử lý logic nghiệp vụ như search, delete, refresh.
 */

import { computed, ref, onBeforeMount, onBeforeUnmount, getCurrentInstance } from "vue";
import type { TableRow, TableStoreInstance } from "@/composables/controls/useTableStore";
import type BaseAPI from "@/api/baseAPI";
import { showConfirm } from "@/commons/messageBox";
import { loadDataRemoteTable } from "@/composables/controls/useTableStore";
import type { PagingRequest } from "@/models/common/paging";
import { debounce } from "lodash";
import { formConfigMap, type FormConfig } from "@/constants/formConfig";
import { FormState, ModelState } from "@/constants/enumration/modelState";
import { attachListDebug, detachListDebug } from "@/composables/base/useDebug";
import { usePopup } from "@/composables/popup/usePopup";
import type { BaseModel } from "@/models/common/baseModel";

/**
 * Dữ liệu đầu vào cho callback validate trước khi xóa.
 */
export interface ValidateBeforeDeletePayload {
    /**
     * Danh sách bản ghi cần xóa.
     */
    records: any[];
    /**
     * Danh sách ID tương ứng của bản ghi cần xóa.
     */
    ids: Array<string | number>;
    /**
     * Đánh dấu thao tác xóa nhiều bản ghi đã chọn.
     */
    isDeleteMultiple: boolean;
}

/**
 * Callback type cho việc validate trước khi xóa (dùng chung cho xóa đơn và xóa nhiều).
 */
export type ValidateBeforeDeleteCallback = (payload: ValidateBeforeDeletePayload) => Promise<boolean>;

/**
 * Options khởi tạo cho useBaseList.
 */
export interface BaseListOptions<TModel extends BaseModel> {
    /**
     * ID của mỗi màn danh sách lấy ra cấu hình static
     */
    formID: string;
    /**
     * Table store instance (bắt buộc).
     */
    tableStore: TableStoreInstance;

    /**
     * API instance để gọi các endpoint CRUD.
     */
    api: BaseAPI;

    /**
     * Callback validate trước khi xóa.
     * Form có thể custom nghiệp vụ validate riêng (xác nhận, ràng buộc dữ liệu...).
     */
    validateBeforeDelete?: ValidateBeforeDeleteCallback;

    /**
     * Thời gian debounce cho search (ms). Mặc định: 500ms
     */
    searchDebounce?: number;

    /**
     * Row key field name. Mặc định: "id"
     */
    rowKey?: string;

    /**
     * Có tự động load data khi khởi tạo không. Mặc định: true
     */
    autoLoad?: boolean;

    /**
     * Callback sau khi load data thành công.
     */
    onLoadSuccess?: () => void;

    /**
     * Callback sau khi load data thất bại.
     */
    onLoadError?: (error: Error) => void;

    /**
     * Callback sau khi delete thành công.
     */
    onDeleteSuccess?: () => void;

    /**
     * Callback sau khi delete thất bại.
     */
    onDeleteError?: (error: Error) => void;
}

/**
 * Factory function tạo base list composable với CRUD operations.
 * @param options Cấu hình cho base list.
 * @returns Base list instance với các methods và state.
 */
export const useBaseList = <TModel extends BaseModel>(options: BaseListOptions<TModel>) => {
    const {
        formID,
        tableStore,
        api,
        validateBeforeDelete,
        rowKey = "id",
        onLoadSuccess,
        onLoadError,
        onDeleteSuccess,
        onDeleteError,
    } = options;
    const { show } = usePopup();

    /**
     * Instance của màn danh sách
     */
    const proxy = getCurrentInstance()?.proxy;

    /**
     * Query text hiện tại cho search.
     */
    const textSearch = ref<string>("");

    /**
     * Cấu hình mặc định ban đầu của form
     */
    const staticConfig = formConfigMap.get(formID) as FormConfig;

    /**
     * Cấu hình thời gian search
     */
    const searchDebounce = 500;

    /**
     * Đồng bộ dữ liệu danh sách khi form detail lưu thành công.
     * @param record Bản ghi vừa lưu.
     */
    const updateListCallback = (record: any): void => {
        if (!record) return;

        switch (record.ModelState) {
            case ModelState.Insert:
                tableStore.insertRecord(record);
                break;
            case ModelState.Update:
                tableStore.updateRecord(record);
                break;
            default:
                break;
        }
    };

    /**
     * Proxy cho loading state từ table store.
     */
    const loading = computed<boolean>(() => tableStore.loading);

    /**
     * Proxy cho data từ table store.
     */
    const data = computed(() => tableStore.data);

    /**
     * Proxy cho selected rows từ table store.
     */
    const selectedRows = computed(() => tableStore.selectedRows);

    /**
     * Số lượng items đang được chọn.
     */
    const selectedCount = computed<number>(() => tableStore.selectedRows.length);

    /**
     * Hàm xử lý search thực tế (sẽ được debounce).
     */
    const performSearch = async (query: string): Promise<void> => {
        try {
            await tableStore.loadData(query, 1);
            onLoadSuccess?.();
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Search failed");
            onLoadError?.(normalizedError);
        }
    };

    /**
     * Debounced search function.
     */
    const debouncedSearch = debounce(performSearch, searchDebounce);

    /**
     * Tìm kiếm dữ liệu với debounce.
     * @param query Từ khóa tìm kiếm.
     * @returns Promise hoàn tất khi search được trigger.
     */
    const onSearch = (query: string): Promise<void> => {
        textSearch.value = query;
        debouncedSearch(query);
        return Promise.resolve();
    };

    /**
     * Xóa search query và load lại toàn bộ data.
     *
     * @returns Promise hoàn tất khi clear search.
     */
    const clearSearch = async (): Promise<void> => {
        textSearch.value = "";

        // Cancel pending debounced search
        debouncedSearch.cancel();

        try {
            await tableStore.loadData("", 1);
            onLoadSuccess?.();
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Clear search failed");
            onLoadError?.(normalizedError);
        }
    };

    /**
     * Chuẩn bị dữ liệu trước khi thực hiện xóa.
     * @param records Danh sách bản ghi cần xóa.
     * @param isDeleteMultiple Đánh dấu thao tác xóa một hay nhiều bản ghi.
     * @returns Kết quả validate cùng danh sách bản ghi đã gắn State xóa.
     */
    const beforeDelete = async (
        records: Array<Record<string, unknown>>,
        isDeleteMultiple: boolean,
    ): Promise<{
        canDelete: boolean;
        ids: Array<string | number>;
        recordsForDelete: Array<Record<string, unknown>>;
    }> => {
        const ids = records
            .map((record) => record[rowKey])
            .filter((id): id is string | number => typeof id === "string" || typeof id === "number");

        if (ids.length === 0) {
            return {
                canDelete: false,
                ids,
                recordsForDelete: [],
            };
        }

        let isValidForDelete = true;

        // Cho phép màn hình custom validate trước khi xóa
        if (validateBeforeDelete) {
            isValidForDelete = await validateBeforeDelete({
                records,
                ids,
                isDeleteMultiple,
            });
        }

        if (!isValidForDelete) {
            return {
                canDelete: false,
                ids,
                recordsForDelete: [],
            };
        }

        const recordsForDelete = records.map((record) => ({
            ...record,
            ModelState: ModelState.Delete,
        }));

        return {
            canDelete: true,
            ids,
            recordsForDelete,
        };
    };

    /**
     * Xóa một item theo bản ghi.
     *
     * @param record Bản ghi cần xóa.
     * @returns Promise trả về true nếu xóa thành công.
     */
    const deleteItem = async (recordData: any): Promise<boolean> => {
        try {
            const { canDelete, recordsForDelete } = await beforeDelete([recordData], false);
            if (!canDelete) return false;

            if (!api) {
                throw new Error("No API configured for delete operation");
            }

            const result = await showConfirm("Bạn có chắc chắn muốn xóa bản ghi này?");
            if (!result) return false;

            // Base mặc định luôn xóa bằng saveData
            const response = await api.saveData(recordsForDelete[0]);
            const success = response.Success === true;

            if (success) {
                // Tối ưu hiệu năng: cập nhật local store thay vì gọi reload từ API.
                tableStore.deleteRecord(recordData);
                onDeleteSuccess?.();
            } else {
                throw new Error("Delete operation failed");
            }

            return success;
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Delete failed");
            onDeleteError?.(normalizedError);
            return false;
        }
    };

    /**
     * Xóa nhiều items đã được chọn.
     * @returns Promise trả về true nếu tất cả đều xóa thành công.
     */
    const deleteSelected = async (): Promise<boolean> => {
        try {
            const selectedItems = [...tableStore.selectedRows] as Array<Record<string, unknown>>;
            const { canDelete, recordsForDelete } = await beforeDelete(selectedItems, true);
            if (!canDelete) return false;

            if (!api) {
                throw new Error("No API configured for delete operation");
            }

            const result = await showConfirm("Bạn có chắc chắn muốn xóa những bản ghi đã chọn này?");
            if (!result) return false;

            // Base mặc định luôn xóa bằng saveListData
            const response = await api.saveListData(recordsForDelete);
            const success = response.Success === true;

            if (success) {
                // Reload data và clear selection
                await tableStore.loadData(textSearch.value, tableStore.currentPage);
                tableStore.clearSelectedRows();
                onDeleteSuccess?.();
            } else {
                throw new Error("Delete multiple operation failed");
            }

            return success;
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Delete multiple failed");
            onDeleteError?.(normalizedError);
            return false;
        }
    };

    /**
     * Refresh data ở trang hiện tại.
     *
     * @returns Promise hoàn tất khi refresh.
     */
    const refresh = async (): Promise<void> => {
        try {
            await tableStore.loadData(textSearch.value, tableStore.currentPage);
            onLoadSuccess?.();
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Refresh failed");
            onLoadError?.(normalizedError);
        }
    };

    /**
     * Load lại data từ trang đầu tiên.
     *
     * @returns Promise hoàn tất khi reload.
     */
    const reload = async (): Promise<void> => {
        try {
            await tableStore.loadData(textSearch.value, 1);
            onLoadSuccess?.();
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Reload failed");
            onLoadError?.(normalizedError);
        }
    };

    /**
     * Thay đổi page size và load lại từ trang 1.
     *
     * @param size Page size mới.
     * @returns Promise hoàn tất khi thay đổi.
     */
    const changePageSize = async (size: number): Promise<void> => {
        try {
            await tableStore.setPageSize(size);
            onLoadSuccess?.();
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Change page size failed");
            onLoadError?.(normalizedError);
        }
    };

    /**
     * Bỏ chọn tất cả.
     */
    const clearSelection = (): void => {
        tableStore.clearSelectedRows();
    };

    /**
     * Kiểm tra một row có được chọn không.
     *
     * @param row Row data.
     * @returns True nếu row được chọn.
     */
    const isRowSelected = (rowData: any): boolean => {
        return tableStore.isRowSelected(rowData, rowKey);
    };

    /**
     * Auto load data khi khởi tạo.
     */
    onBeforeMount(() => {
        // Load dữ liệu lần đầu
        tableStore
            .loadData()
            .then(() => {
                onLoadSuccess?.();
            })
            .catch((error) => {
                const normalizedError = error instanceof Error ? error : new Error("Auto load failed");
                onLoadError?.(normalizedError);
            });
    });

    /**
     * Cleanup function để clear debounce khi component unmount.
     */
    const cleanup = (): void => {
        debouncedSearch.cancel();
    };

    /**
     * Load danh sách dữ liệu
     * @param payload
     * @returns
     */
    const loadListData = (payload: PagingRequest) => {
        // Ngầm định sắp xếp
        defaultSort(payload);

        // Build filter
        buildFilterCondition(payload);

        return loadDataRemoteTable(api, payload);
    };

    /**
     * Ngầm định sắp xếp
     * @param payload
     */
    const defaultSort = (payload: PagingRequest) => {
        if (!payload.sort || payload.sort.length == 0) {
            payload.sort = [
                {
                    property: "CreatedDate",
                    desc: true,
                },
            ];
        }
    };

    /**
     * Xử lý action thao tác trên từng dòng dữ liệu danh sách.
     * @param action Action được click từ danh sách.
     * @param row Bản ghi tương ứng với action.
     * @returns Không trả về giá trị.
     */
    const onListItemAction = (rowAction: any, rowData: TableRow): void => {
        switch (rowAction.actionName) {
            case "Edit":
                editItem(rowData);
                break;
            case "Delete":
                deleteItem(rowData);
                break;
            default:
                break;
        }
    };

    /**
     * Xử lý build filter cho danh sách
     * @param payload
     */
    const buildFilterCondition = (payload: PagingRequest) => {};

    /**
     * Hiển thị popup thêm mới theo cấu hình của màn danh sách.
     * @returns Không trả về giá trị.
     */
    const createItem = (): void => {
        const detailFormID = staticConfig.DetailFormID;
        if (!detailFormID) {
            return;
        }
        show(detailFormID, {
            FormState: FormState.Add,
            RecordData: null,
            updateListCallback,
        });
    };

    /**
     * Hiển thị popup chỉnh sửa theo bản ghi được chọn.
     * @param rowData Dữ liệu bản ghi cần chỉnh sửa.
     * @returns Không trả về giá trị.
     */
    const editItem = async (rowData: TableRow) => {
        const detailFormID = staticConfig.DetailFormID;
        if (!detailFormID) {
            return;
        }

        let recordData = {};
        try {
            if (rowData) {
                const detailID = rowData[rowKey] as string;
                if (!detailID) {
                    throw new Error("Missing record ID for edit form");
                }
                const res = await api.getByID<TModel>(detailID);
                if (res.Success && res.Data) {
                    recordData = res.Data;
                }
            }
        } catch (error) {
            console.error("[ERROR] editItem:", error);
        }

        // Hiển thị form chi tiết với data đã lấy được
        show(detailFormID, {
            FormState: FormState.Edit,
            RecordData: recordData,
            updateListCallback,
        });
    };

    /**
     * Câp nhật trạng thái của một hoặc nhiều bản ghi đã chọn.
     * @param status
     */
    const updateStatus = async (status: number): Promise<void> => {
        try {
            const lstIds = selectedRows.value
                .map((row) => row[rowKey])
                .filter((id): id is string => typeof id === "string");
            const res = await api.updateStatus(lstIds, status);
            if (res.Success && res.Data) {
                selectedRows.value.forEach((row) => {
                    row.Status = status;
                });
            }
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error("Update status failed");
            console.error(normalizedError);
        }
    };

    const baseListInstance = {
        proxy,
        textSearch,
        tableStore,
        loading,
        data,
        selectedRows,
        selectedCount,
        staticConfig,
        onSearch,
        clearSearch,
        deleteItem,
        deleteSelected,
        refresh,
        reload,
        changePageSize,
        clearSelection,
        isRowSelected,
        cleanup,
        loadListData,
        createItem,
        editItem,
        onListItemAction,
        updateStatus,
    };

    attachListDebug(baseListInstance);

    onBeforeUnmount(() => {
        cleanup();
        detachListDebug();
    });

    return baseListInstance;
};

/**
 * Type của instance được return từ useBaseList.
 */
export type BaseListInstance = ReturnType<typeof useBaseList>;
