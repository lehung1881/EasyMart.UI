/**
 * useBaseList.ts
 * Business logic layer - Composable factory cho màn hình danh sách với CRUD operations.
 * Layer này nằm trên useTableStore, xử lý logic nghiệp vụ như search, delete, refresh.
 */

import { computed, ref } from "vue";
import type { TableStoreInstance } from "@/composables/controls/useTableStore";
import type BaseAPI from "@/api/baseAPI";

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
    isDeleteSelected: boolean;
}

/**
 * Callback type cho việc validate trước khi xóa (dùng chung cho xóa đơn và xóa nhiều).
 */
export type ValidateBeforeDeleteCallback = (payload: ValidateBeforeDeletePayload) => Promise<boolean>;

/**
 * Options khởi tạo cho useBaseList.
 */
export interface BaseListOptions {
    /**
     * Table store instance (bắt buộc).
     */
    tableStore: TableStoreInstance;

    /**
     * API instance để gọi các endpoint CRUD.
     */
    api?: BaseAPI;

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
 * State quản lý các thao tác CRUD của list.
 */
export interface BaseListState {
    /**
     * Trạng thái đang thực hiện thao tác delete.
     */
    deleting: boolean;

    /**
     * Lỗi xảy ra trong quá trình delete.
     */
    deleteError: string | null;

    /**
     * Query text hiện tại cho search.
     */
    searchQuery: string;

    /**
     * Trạng thái đang refresh data.
     */
    refreshing: boolean;
}

/**
 * Factory function tạo base list composable với CRUD operations.
 * @param options Cấu hình cho base list.
 * @returns Base list instance với các methods và state.
 */
export const useBaseList = (options: BaseListOptions) => {
    const {
        tableStore,
        api,
        validateBeforeDelete,
        searchDebounce = 500,
        rowKey = "id",
        autoLoad = true,
        onLoadSuccess,
        onLoadError,
        onDeleteSuccess,
        onDeleteError,
    } = options;

    const state = ref<BaseListState>({
        deleting: false,
        deleteError: null,
        searchQuery: "",
        refreshing: false,
    });

    let searchTimeoutId: ReturnType<typeof setTimeout> | null = null;

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
     * Tìm kiếm dữ liệu với debounce.
     * @param query Từ khóa tìm kiếm.
     * @returns Promise hoàn tất khi search được trigger.
     */
    const search = (query: string): Promise<void> => {
        return new Promise((resolve) => {
            state.value.searchQuery = query;

            // Clear timeout cũ nếu có
            if (searchTimeoutId !== null) {
                clearTimeout(searchTimeoutId);
            }

            // Set timeout mới
            searchTimeoutId = setTimeout(async () => {
                try {
                    await tableStore.loadData(query, 1);
                    onLoadSuccess?.();
                } catch (error) {
                    const err = error instanceof Error ? error : new Error("Search failed");
                    onLoadError?.(err);
                } finally {
                    resolve();
                }
            }, searchDebounce);
        });
    };

    /**
     * Xóa search query và load lại toàn bộ data.
     *
     * @returns Promise hoàn tất khi clear search.
     */
    const clearSearch = async (): Promise<void> => {
        state.value.searchQuery = "";

        if (searchTimeoutId !== null) {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = null;
        }

        try {
            await tableStore.loadData("", 1);
            onLoadSuccess?.();
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Clear search failed");
            onLoadError?.(err);
        }
    };

    /**
     * Xóa một item theo bản ghi.
     *
     * @param record Bản ghi cần xóa.
     * @returns Promise trả về true nếu xóa thành công.
     */
    const deleteItem = async (record: any): Promise<boolean> => {
        state.value.deleting = true;
        state.value.deleteError = null;

        try {
            let isValidForDelete = true;

            // Cho phép màn hình custom validate trước khi xóa
            if (validateBeforeDelete) {
                isValidForDelete = await validateBeforeDelete({
                    records: [record],
                    ids: [record?.[rowKey] as string | number],
                    isDeleteSelected: false,
                });
            }

            if (!isValidForDelete) {
                return false;
            }

            if (!api) {
                throw new Error("No API configured for delete operation");
            }

            // Base mặc định luôn xóa bằng saveData
            const response = await api.saveData(record);
            const success = response.Success === true;

            if (success) {
                // Reload data sau khi xóa thành công
                await tableStore.loadData(state.value.searchQuery, tableStore.currentPage);

                // Xóa khỏi selection nếu có
                const updatedSelection = tableStore.selectedRows.filter((row) => row[rowKey] !== record[rowKey]);
                tableStore.setSelectedRows(updatedSelection);

                onDeleteSuccess?.();
            } else {
                throw new Error("Delete operation failed");
            }

            return success;
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Delete failed");
            state.value.deleteError = err.message;
            onDeleteError?.(err);
            return false;
        } finally {
            state.value.deleting = false;
        }
    };

    /**
     * Xóa nhiều items đã được chọn.
     *
     * @returns Promise trả về true nếu tất cả đều xóa thành công.
     */
    const deleteSelected = async (): Promise<boolean> => {
        state.value.deleting = true;
        state.value.deleteError = null;

        try {
            const ids = tableStore.selectedRows.map((row) => row[rowKey] as string | number);
            const selectedItems = [...tableStore.selectedRows];
            let isValidForDelete = true;

            // Cho phép màn hình custom validate trước khi xóa
            if (validateBeforeDelete) {
                isValidForDelete = await validateBeforeDelete({
                    records: selectedItems,
                    ids,
                    isDeleteSelected: true,
                });
            }

            if (!isValidForDelete) {
                return false;
            }

            if (!api) {
                throw new Error("No API configured for delete operation");
            }

            // Base mặc định luôn xóa bằng saveListData
            const response = await api.saveListData(selectedItems);
            const success = response.Success === true;

            if (success) {
                // Reload data và clear selection
                await tableStore.loadData(state.value.searchQuery, tableStore.currentPage);
                tableStore.clearSelectedRows();
                onDeleteSuccess?.();
            } else {
                throw new Error("Delete multiple operation failed");
            }

            return success;
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Delete multiple failed");
            state.value.deleteError = err.message;
            onDeleteError?.(err);
            return false;
        } finally {
            state.value.deleting = false;
        }
    };

    /**
     * Refresh data ở trang hiện tại.
     *
     * @returns Promise hoàn tất khi refresh.
     */
    const refresh = async (): Promise<void> => {
        state.value.refreshing = true;
        try {
            await tableStore.loadData(state.value.searchQuery, tableStore.currentPage);
            onLoadSuccess?.();
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Refresh failed");
            onLoadError?.(err);
        } finally {
            state.value.refreshing = false;
        }
    };

    /**
     * Load lại data từ trang đầu tiên.
     *
     * @returns Promise hoàn tất khi reload.
     */
    const reload = async (): Promise<void> => {
        state.value.refreshing = true;
        try {
            await tableStore.loadData(state.value.searchQuery, 1);
            onLoadSuccess?.();
        } catch (error) {
            const err = error instanceof Error ? error : new Error("Reload failed");
            onLoadError?.(err);
        } finally {
            state.value.refreshing = false;
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
            const err = error instanceof Error ? error : new Error("Change page size failed");
            onLoadError?.(err);
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
    const isRowSelected = (row: any): boolean => {
        return tableStore.isRowSelected(row, rowKey);
    };

    /**
     * Auto load data khi khởi tạo.
     */
    if (autoLoad) {
        tableStore
            .loadData()
            .then(() => {
                onLoadSuccess?.();
            })
            .catch((error) => {
                const err = error instanceof Error ? error : new Error("Auto load failed");
                onLoadError?.(err);
            });
    }

    /**
     * Cleanup function để clear timeout khi component unmount.
     */
    const cleanup = (): void => {
        if (searchTimeoutId !== null) {
            clearTimeout(searchTimeoutId);
            searchTimeoutId = null;
        }
    };

    return {
        state,
        tableStore,
        loading,
        data,
        selectedRows,
        selectedCount,
        search,
        clearSearch,
        deleteItem,
        deleteSelected,
        refresh,
        reload,
        changePageSize,
        clearSelection,
        isRowSelected,
        cleanup,
    };
};

/**
 * Type của instance được return từ useBaseList.
 */
export type BaseListInstance = ReturnType<typeof useBaseList>;
