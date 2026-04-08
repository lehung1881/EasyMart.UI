/**
 * useTableStore.ts
 * Data layer - Pinia factory store for BaseTable.
 */

import { computed, ref } from "vue";
import { defineStore } from "pinia";
import commonFunction from "@/commons/commonFunction";
import type { QueryMode } from "@/models/common/combobox";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import type { PagingRequest, SortCondition } from "@/models/common/paging";
import type BaseAPI from "@/api/baseAPI";

const STORE_NAME_TEMPLATE = "store_table_{0}_{1}";

/**
 * Default row model for the table.
 */
export type TableRow = Record<string, unknown>;

/**
 * Load result model used by table remote mode.
 */
export interface TableLoadDataResult {
    rows: Array<TableRow>;
    total?: number;
}

/**
 * Load callback type for table remote mode.
 */
export type TableLoadData = (payload: PagingRequest) => Promise<TableLoadDataResult | Array<TableRow>>;

/**
 * Store options used for table initialization.
 */
export interface TableStoreOptions {
    data?: Array<TableRow>;
    tableLoadData?: TableLoadData;
    queryMode?: QueryMode;
    pageSize?: number;
    viewOrTableName?: string;
    columns?: ColumnDefinition[];
    keyID?: string;
    sorts?: SortCondition[];
}

/**
 * Create and get table store instance by store id.
 * @param storeID Store identifier.
 * @param options Store initialization options.
 * @returns Table store instance.
 */
export const useTableStore = (storeID: string, options?: TableStoreOptions) => {
    const storeName = STORE_NAME_TEMPLATE.replace("{0}", storeID)
        .replace("{1}", commonFunction.genShortID())
        .toLowerCase();

    const store = defineStore(storeName, () => {
        const data = ref<Array<TableRow>>([]);
        const loading = ref<boolean>(false);
        const columns = ref<ColumnDefinition[]>([]);
        const selectedRows = ref<Array<TableRow>>([]);

        const rawData = ref<Array<TableRow>>([]);
        const filteredData = ref<Array<TableRow>>([]);
        const loadFn = ref<TableLoadData | null>(null);
        const mode = ref<QueryMode>("remote");
        const pageSize = ref<number>(20);
        const currentPage = ref<number>(1);
        const currentQuery = ref<string>("");
        const totalRecords = ref<number>(0);
        const viewName = ref<string>("");
        const keyID = ref<string>("id");

        /**
         * Check if store is running in remote mode.
         * @returns True when mode is remote.
         */
        const isRemoteMode = (): boolean => mode.value === "remote";

        /**
         * Convert load callback result to normalized shape.
         * @param result Raw callback result.
         * @returns Normalized rows and total value.
         */
        const normalizeLoadResult = (result: TableLoadDataResult | Array<TableRow>): TableLoadDataResult => {
            if (Array.isArray(result)) return { rows: result, total: undefined };
            return { rows: result.rows ?? [], total: result.total };
        };

        /**
         * Resolve key value from row by row key field.
         * @param row Row data.
         * @param keyID Row key field name.
         * @returns Primitive key value or undefined.
         */
        const resolveRowKey = (row: TableRow, keyID = "id"): string | number | undefined => {
            const key = row[keyID];
            if (typeof key === "string" || typeof key === "number") return key;
            return undefined;
        };

        /**
         * Build filterable fields for local query.
         * @returns Field list used for text matching.
         */
        const getFilterFields = (): Array<string> => {
            const fields = columns.value
                .map((column) => column.dataField?.trim())
                .filter((field): field is string => Boolean(field));

            if (fields.length > 0) return fields;

            const firstRow = rawData.value[0] ?? {};
            return Object.keys(firstRow);
        };

        /**
         * Filter local raw data by query text.
         * @param keyword Search text.
         * @returns Filtered rows.
         */
        const filterLocalData = (keyword: string): Array<TableRow> => {
            const normalizedKeyword = keyword.trim().toLowerCase();
            if (!normalizedKeyword) return [...rawData.value];

            const filterFields = getFilterFields();
            if (filterFields.length === 0) return [...rawData.value];

            return rawData.value.filter((row) =>
                filterFields.some((field) =>
                    String(row[field] ?? "")
                        .toLowerCase()
                        .includes(normalizedKeyword),
                ),
            );
        };

        /**
         * Slice local filtered rows by current paging.
         * @returns Visible rows for current page.
         */
        const sliceLocalPage = (): Array<TableRow> => {
            const startIndex = (currentPage.value - 1) * pageSize.value;
            const endIndex = startIndex + pageSize.value;
            return filteredData.value.slice(startIndex, endIndex);
        };

        /**
         * Build remote paging payload.
         * @param pageIndex Page index to load.
         * @returns Paging request payload.
         */
        const buildPayload = (pageIndex: number): PagingRequest => ({
            pageIndex,
            pageSize: pageSize.value,
            sort: options?.sorts ?? [],
            filter: [],
            columns: "",
            viewOrTableName: viewName.value,
        });

        /**
         * Total number of pages from current state.
         * @returns Number of pages.
         */
        const pageCount = computed<number>(() => {
            if (totalRecords.value <= 0) return 1;
            return Math.max(1, Math.ceil(totalRecords.value / pageSize.value));
        });

        /**
         * Start row number of current page.
         * @returns Start row index in 1-based format.
         */
        const startRow = computed<number>(() => {
            if (totalRecords.value === 0) return 0;
            return (currentPage.value - 1) * pageSize.value + 1;
        });

        /**
         * End row number of current page.
         * @returns End row index in 1-based format.
         */
        const endRow = computed<number>(() => {
            if (totalRecords.value === 0) return 0;
            return Math.min(currentPage.value * pageSize.value, totalRecords.value);
        });

        /**
         * Check if user can go to previous page.
         * @returns True when previous page exists.
         */
        const canGoPrev = computed<boolean>(() => currentPage.value > 1);

        /**
         * Check if user can go to next page.
         * @returns True when next page exists.
         */
        const canGoNext = computed<boolean>(() => currentPage.value < pageCount.value);

        /**
         * Check whether a row is selected.
         * @param row Row data.
         * @param keyID Row key field.
         * @returns True when row exists in selectedRows.
         */
        const isRowSelected = (row: TableRow, keyID = "id"): boolean => {
            const key = resolveRowKey(row, keyID);
            if (key === undefined) return false;
            return selectedRows.value.some((selectedRow) => resolveRowKey(selectedRow, keyID) === key);
        };

        /**
         * Add or remove a row in selectedRows.
         * @param row Row data.
         * @param checked Checkbox state.
         * @param keyID Row key field.
         * @returns No return value.
         */
        const toggleRowSelection = (row: TableRow, checked: boolean, keyID = "id"): void => {
            const key = resolveRowKey(row, keyID);
            if (key === undefined) return;

            if (checked) {
                if (isRowSelected(row, keyID)) return;
                selectedRows.value = [...selectedRows.value, row];
                return;
            }

            selectedRows.value = selectedRows.value.filter((selectedRow) => resolveRowKey(selectedRow, keyID) !== key);
        };

        /**
         * Replace selectedRows by external value.
         * @param rows New selected rows.
         * @returns No return value.
         */
        const setSelectedRows = (rows: Array<TableRow>): void => {
            selectedRows.value = [...rows];
        };

        /**
         * Clear all selected rows.
         * @returns No return value.
         */
        const clearSelectedRows = (): void => {
            selectedRows.value = [];
        };
        /**
         * Delete one record from store collections by object value.
         * @param record Record object that needs to be removed.
         * @returns No return value.
         */
        const deleteRecord = (record: TableRow): void => {
            const key = resolveRowKey(record, keyID.value);
            if (key === undefined) return;

            const hasRemovedFromData = data.value.some((row) => resolveRowKey(row, keyID.value) === key);

            data.value = data.value.filter((row) => resolveRowKey(row, keyID.value) !== key);
            rawData.value = rawData.value.filter((row) => resolveRowKey(row, keyID.value) !== key);
            filteredData.value = filteredData.value.filter((row) => resolveRowKey(row, keyID.value) !== key);
            selectedRows.value = selectedRows.value.filter((row) => resolveRowKey(row, keyID.value) !== key);

            if (isRemoteMode()) {
                if (hasRemovedFromData) {
                    totalRecords.value = Math.max(0, totalRecords.value - 1);
                }
                return;
            }

            totalRecords.value = filteredData.value.length;
        };

        /**
         * Load data for provided page and query.
         * @param query Query text.
         * @param page Target page index.
         * @returns Promise when load completes.
         */
        /**
         * Clear toàn bộ dữ liệu trong store.
         * @returns Không trả về giá trị.
         */
        const clearData = (): void => {
            data.value = [];
            rawData.value = [];
            filteredData.value = [];
            selectedRows.value = [];
            totalRecords.value = 0;
            currentPage.value = 1;
        };

        /**
         * Thêm một bản ghi mới vào đầu danh sách trong store.
         * @param record Bản ghi cần thêm.
         * @returns Không trả về giá trị.
         */
        const insertRecord = (record: TableRow): void => {
            data.value = [record, ...data.value];
            rawData.value = [record, ...rawData.value];
            filteredData.value = [record, ...filteredData.value];
            totalRecords.value += 1;
        };

        const loadData = async (query = "", page = 1): Promise<void> => {
            currentQuery.value = query;
            currentPage.value = Math.max(1, page);

            if (!isRemoteMode()) {
                filteredData.value = filterLocalData(query);
                totalRecords.value = filteredData.value.length;
                data.value = sliceLocalPage();
                return;
            }

            if (!loadFn.value) {
                data.value = [];
                totalRecords.value = 0;
                return;
            }

            loading.value = true;
            try {
                const result = normalizeLoadResult(await loadFn.value(buildPayload(currentPage.value)));
                data.value = result.rows;
                totalRecords.value =
                    typeof result.total === "number"
                        ? result.total
                        : result.rows.length < pageSize.value
                          ? (currentPage.value - 1) * pageSize.value + result.rows.length
                          : currentPage.value * pageSize.value + 1;
            } finally {
                loading.value = false;
            }
        };

        /**
         * Navigate to specific page.
         * @param page Target page number.
         * @returns Promise when load completes.
         */
        const goToPage = async (page: number): Promise<void> => {
            const safePage = Math.max(1, page);
            const boundedPage = Math.min(safePage, pageCount.value);
            await loadData(currentQuery.value, boundedPage);
        };

        /**
         * Navigate to first page.
         * @returns Promise when load completes.
         */
        const goToFirstPage = async (): Promise<void> => {
            await goToPage(1);
        };

        /**
         * Navigate to previous page.
         * @returns Promise when load completes.
         */
        const goToPrevPage = async (): Promise<void> => {
            if (!canGoPrev.value) return;
            await goToPage(currentPage.value - 1);
        };

        /**
         * Navigate to next page.
         * @returns Promise when load completes.
         */
        const goToNextPage = async (): Promise<void> => {
            if (!canGoNext.value) return;
            await goToPage(currentPage.value + 1);
        };

        /**
         * Navigate to last page.
         * @returns Promise when load completes.
         */
        const goToLastPage = async (): Promise<void> => {
            await goToPage(pageCount.value);
        };

        /**
         * Change page size and reload from first page.
         * @param nextPageSize New page size value.
         * @returns Promise when reload completes.
         */
        const setPageSize = async (nextPageSize: number): Promise<void> => {
            if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return;
            pageSize.value = Math.floor(nextPageSize);
            await loadData(currentQuery.value, 1);
        };

        /**
         * Sync store options.
         * @param config Updated store options.
         * @returns No return value.
         */
        const initConfigStore = (config: TableStoreOptions): void => {
            loadFn.value = config.tableLoadData ?? null;
            mode.value = config.queryMode ?? (config.data ? "local" : "remote");
            pageSize.value = config.pageSize ?? 20;
            viewName.value = config.viewOrTableName ?? "";
            columns.value = config.columns ?? [];
            keyID.value = config.keyID ?? "id";
            rawData.value = config.data ? [...config.data] : [];
            filteredData.value = config.data ? [...config.data] : [];
            totalRecords.value = filteredData.value.length;
            selectedRows.value = [];
        };

        /**
         * Reset all store state to initial value.
         * @returns No return value.
         */
        const reset = (): void => {
            data.value = [];
            rawData.value = [];
            filteredData.value = [];
            loading.value = false;
            currentPage.value = 1;
            currentQuery.value = "";
            totalRecords.value = 0;
            selectedRows.value = [];
            keyID.value = "id";
        };

        return {
            data,
            loading,
            columns,
            keyID,
            selectedRows,
            currentPage,
            pageSize,
            currentQuery,
            totalRecords,
            pageCount,
            startRow,
            endRow,
            canGoPrev,
            canGoNext,
            isRowSelected,
            toggleRowSelection,
            setSelectedRows,
            clearSelectedRows,
            deleteRecord,
            clearData,
            insertRecord,
            loadData,
            goToPage,
            goToFirstPage,
            goToPrevPage,
            goToNextPage,
            goToLastPage,
            setPageSize,
            initConfigStore,
            reset,
        };
    });

    const instance = store();

    if (options) {
        instance.initConfigStore(options);
    }

    return instance;
};

export type TableStoreInstance = ReturnType<typeof useTableStore>;

/**
 * Shared remote loader helper for table store.
 * @param api Base API instance.
 * @param payload Paging payload.
 * @returns Load result with rows and total records.
 */
export const loadDataRemoteTable = async (api: BaseAPI, payload: PagingRequest): Promise<TableLoadDataResult> => {
    const response = await api.getPagingData(payload);
    return {
        rows: response.Data?.PageData ?? [],
        total: response.Data?.Total ?? 0,
    };
};
