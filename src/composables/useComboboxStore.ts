/**
 * useComboboxStore.ts
 * Data layer — Pinia factory store cho BaseCombobox.
 * Mỗi storeID tạo một instance độc lập; gọi cùng storeID trả về cùng instance.
 */

import { ref } from "vue";
import { defineStore } from "pinia";
import commonFunction from "@/commons/commonFunction";
import type { PagingRequest } from "@/models/common/paging";
import type BaseAPI from "@/api/baseAPI";
import type { ComboboxLoadData, ComboboxStoreOptions, QueryMode, StoreConfig } from "@/models/common/combobox";

const STORE_NAME_TEMPLATE = "combobox_{0}_{1}";

export function useComboboxStore(storeID: string, options?: ComboboxStoreOptions) {
    const storeName = STORE_NAME_TEMPLATE.replace("{0}", storeID)
        .replace("{1}", commonFunction.genShortID())
        .toLowerCase();

    const store = defineStore(storeName, () => {
        // Public state

        /** Data hiển thị trong dropdown */
        const data = ref<Array<any>>([]);

        /** Loading khi load lần đầu */
        const loading = ref<boolean>(false);

        /** Loading khi load thêm (infinite scroll) */
        const loadingMore = ref<boolean>(false);

        /** Có còn dữ liệu để load thêm không */
        const hasMore = ref<boolean>(false);

        // Internal state

        /** Data gốc (local mode) */
        const rawData = ref<Array<any>>([]);

        /** Hàm gọi API (remote mode) */
        const loadFn = ref<ComboboxLoadData | null>(null);

        /** Mode truy vấn */
        const mode = ref<QueryMode>("remote");

        /** Số bản ghi mỗi trang */
        const pageSize = ref<number>(20);

        /** Trang hiện tại */
        const currentPage = ref<number>(1);

        /** Keyword hiện tại */
        const currentKeyword = ref<string>("");

        /** View/Table name gửi BE */
        const viewName = ref<string>("");

        // Private helpers

        /**
         * buildPayload — Tạo payload chuẩn gửi BE
         */
        const buildPayload = (pageIndex: number): PagingRequest => ({
            pageIndex,
            pageSize: pageSize.value,
            sort: [],
            filter: [],
            columns: "",
            viewOrTableName: viewName.value,
        });

        /**
         * isRemoteMode — Kiểm tra có phải remote không
         */
        const isRemoteMode = (): boolean => mode.value === "remote";

        /**
         * updateHasMore — Kiểm tra còn data không
         */
        const updateHasMore = (result: Array<any>): void => {
            hasMore.value = result.length >= pageSize.value;
        };

        // Actions

        /**
         * loadData — Load trang đầu tiên (hoặc reset khi keyword đổi)
         * Local  : filter trực tiếp trên rawData.
         * Remote : reset page về 1, replace data.
         */
        const loadData = async (keyword: string, displayField?: string): Promise<void> => {
            // LOCAL MODE
            if (!isRemoteMode()) {
                if (!keyword || !displayField) {
                    data.value = [...rawData.value];
                } else {
                    const kw = keyword.toLowerCase();

                    data.value = rawData.value.filter((item) => String(item[displayField]).toLowerCase().includes(kw));
                }
                return;
            }

            // REMOTE MODE
            if (!loadFn.value) return;

            // Gán keyword
            currentKeyword.value = keyword;

            // Reset paging
            currentPage.value = 1;
            hasMore.value = false;

            loading.value = true;
            try {
                const result = await loadFn.value(buildPayload(1));

                // Replace data
                data.value = result;

                // Update hasMore
                updateHasMore(result);
            } finally {
                loading.value = false;
            }
        };

        /**
         * loadNextPage — Load thêm trang tiếp theo (infinite scroll)
         * Chỉ áp dụng cho remote mode.
         */
        const loadNextPage = async (): Promise<void> => {
            if (!isRemoteMode()) return;
            if (!loadFn.value) return;
            if (loadingMore.value || !hasMore.value) return;

            const nextPage = currentPage.value + 1;

            loadingMore.value = true;
            try {
                const result = await loadFn.value(buildPayload(nextPage));

                // Append data
                data.value = [...data.value, ...result];

                // Update page
                currentPage.value = nextPage;

                // Update hasMore
                updateHasMore(result);
            } finally {
                loadingMore.value = false;
            }
        };

        /**
         * configure — Thiết lập config và reset toàn bộ state
         */
        const configure = (config: StoreConfig): void => {
            loadFn.value = config.fn ?? null;

            // Gán data local
            rawData.value = config.staticData ? [...config.staticData] : [];
            data.value = config.staticData ? [...config.staticData] : [];

            // Gán config
            mode.value = config.queryMode;
            pageSize.value = config.pageSize;
            viewName.value = config.viewOrTableName ?? "";

            // Reset state
            currentPage.value = 1;
            currentKeyword.value = "";
            hasMore.value = false;
        };

        /**
         * syncConfig — Đồng bộ config nhưng không reset data
         */
        const syncConfig = (config: StoreConfig): void => {
            loadFn.value = config.fn ?? null;
            mode.value = config.queryMode;
            pageSize.value = config.pageSize;
            viewName.value = config.viewOrTableName ?? "";

            if (config.staticData !== rawData.value) {
                rawData.value = config.staticData ? [...config.staticData] : [];
                data.value = config.staticData ? [...config.staticData] : [];
            }
        };

        /**
         * reset — Đưa store về trạng thái ban đầu
         */
        const reset = (): void => {
            data.value = [];
            rawData.value = [];

            loading.value = false;
            loadingMore.value = false;
            hasMore.value = false;

            currentPage.value = 1;
            currentKeyword.value = "";
        };

        return {
            data,
            loading,
            loadingMore,
            hasMore,
            loadData,
            loadNextPage,
            configure,
            syncConfig,
            reset,
        };
    });

    const instance = store();

    // Init options

    if (options) {
        const resolvedMode: QueryMode = options.queryMode ?? (options.data ? "local" : "remote");

        instance.syncConfig({
            fn: options.comboboxLoadData ?? null,
            staticData: options.data ?? null,
            queryMode: resolvedMode,
            pageSize: options.pageSize ?? 20,
            viewOrTableName: options.viewOrTableName ?? "",
        });
    }

    return instance;
}

export type ComboboxStoreInstance = ReturnType<typeof useComboboxStore>;

/**
 * Hàm lấy data cho combobox ở remote mode, dùng chung để truyền vào store.
 * @param api - Instance của BaseAPI hoặc class con kế thừa
 * @param payload - Payload chuẩn gửi BE, store sẽ gọi hàm này với payload đã build sẵn
 * @returns Mảng data trả về từ BE, hoặc mảng rỗng nếu lỗi
 */
export const loadDataRemoteCombobox = async (api: BaseAPI, payload: PagingRequest) => {
    const response = await api.getDataCombobox(payload);
    return response.Data?.PageData ?? [];
};
