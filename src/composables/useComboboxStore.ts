/**
 * useComboboxStore.ts
 * Data layer — Pinia factory store cho BaseCombobox.
 * Mỗi storeId tạo một instance độc lập; gọi cùng storeId trả về cùng instance.
 */

import { ref } from "vue";
import commonFunction from "@/commons/commonFunction";
import { defineStore } from "pinia";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueryMode = "local" | "remote";

export interface ComboboxLoadPayload {
    keyword: string;
    pageSize: number;
    pageIndex: number;
}

export type ComboboxLoadData = (payload: ComboboxLoadPayload) => Promise<Array<any>>;

export interface ComboboxStoreOptions {
    /**
     * Dữ liệu tĩnh — dùng cho local mode.
     * Store filter trực tiếp trên mảng này, không gọi API.
     */
    data?: Array<any>;
    /**
     * Hàm gọi API — chỉ dùng cho remote mode.
     * Nhận payload { keyword, pageSize, pageIndex }, tự xử lý đẩy xuống BE.
     */
    comboboxLoadData?: ComboboxLoadData;
    /** default: "local" nếu có data, "remote" nếu có comboboxLoadData */
    queryMode?: QueryMode;
    /** Số bản ghi mỗi trang — default: 20 */
    pageSize?: number;
}

/** Config nội bộ truyền vào configure / syncConfig */
interface StoreConfig {
    fn?: ComboboxLoadData | null;
    staticData?: Array<any> | null;
    queryMode: QueryMode;
    pageSize: number;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const ComboboxStoreName = "Combobox_{0}_{1}";

export function useComboboxStore(storeId: string, options?: ComboboxStoreOptions) {
    const storeName = ComboboxStoreName.replace("{0}", storeId)
        .replace("{1}", commonFunction.genShortID())
        .toLowerCase();

    const store = defineStore(storeName, () => {
        // ── Public state ──────────────────────────────────────────────────────
        /** Data hiển thị trong dropdown */
        const data = ref<Array<any>>([]);
        /** Trạng thái đang tải (lần đầu hoặc reset) */
        const loading = ref<boolean>(false);
        /** Trạng thái đang tải thêm trang kế (infinite scroll) */
        const loadingMore = ref<boolean>(false);
        /** Còn dữ liệu để load thêm không — dùng để ẩn/hiện sentinel */
        const hasMore = ref<boolean>(false);

        // ── Internal state ────────────────────────────────────────────────────
        /** Data gốc cho local mode */
        const rawData = ref<Array<any>>([]);
        /** Hàm gọi API — chỉ remote mode */
        const comboboxLoadData = ref<ComboboxLoadData | null>(null);
        /** Query mode */
        const mode = ref<QueryMode>("remote");
        /** Số bản ghi mỗi trang */
        const pageSize = ref<number>(20);
        /** Trang hiện tại đã load (remote mode) */
        const currentPage = ref<number>(1);
        /** Keyword đang tìm kiếm — để loadNextPage dùng lại */
        const currentKeyword = ref<string>("");

        // ── Actions ───────────────────────────────────────────────────────────

        /**
         * loadData — Load trang đầu tiên (hoặc reset khi keyword đổi).
         *
         * Local  : filter trực tiếp trên rawData.
         * Remote : reset page về 1, replace data.
         */
        const loadData = async (keyword: string, displayField?: string): Promise<void> => {
            // LOCAL MODE
            if (mode.value === "local") {
                if (!keyword || !displayField) {
                    data.value = [...rawData.value];
                } else {
                    const kw = keyword.toLowerCase();
                    data.value = rawData.value.filter((item) => String(item[displayField]).toLowerCase().includes(kw));
                }
                return;
            }

            // REMOTE MODE
            if (!comboboxLoadData.value) return;

            currentKeyword.value = keyword;
            currentPage.value = 1;
            hasMore.value = false;

            loading.value = true;
            try {
                const result = await comboboxLoadData.value({
                    keyword,
                    pageSize: pageSize.value,
                    pageIndex: 1,
                });
                data.value = result;
                hasMore.value = result.length >= pageSize.value;
            } finally {
                loading.value = false;
            }
        };

        /**
         * loadNextPage — Append trang tiếp theo vào data (infinite scroll).
         * Chỉ dùng cho remote mode. Bỏ qua nếu đang load hoặc hết data.
         */
        const loadNextPage = async (): Promise<void> => {
            if (mode.value !== "remote") return;
            if (!comboboxLoadData.value) return;
            if (loadingMore.value || !hasMore.value) return;

            const nextPage = currentPage.value + 1;
            loadingMore.value = true;
            try {
                const result = await comboboxLoadData.value({
                    keyword: currentKeyword.value,
                    pageSize: pageSize.value,
                    pageIndex: nextPage,
                });
                data.value = [...data.value, ...result];
                currentPage.value = nextPage;
                hasMore.value = result.length >= pageSize.value;
            } finally {
                loadingMore.value = false;
            }
        };

        /**
         * configure — Thay đổi config và reset toàn bộ state.
         */
        const configure = (config: StoreConfig): void => {
            comboboxLoadData.value = config.fn ?? null;
            rawData.value = config.staticData ? [...config.staticData] : [];
            data.value = config.staticData ? [...config.staticData] : [];
            mode.value = config.queryMode;
            pageSize.value = config.pageSize;
            currentPage.value = 1;
            currentKeyword.value = "";
            hasMore.value = false;
        };

        /**
         * syncConfig — Chỉ cập nhật config, KHÔNG reset data.
         */
        const syncConfig = (config: StoreConfig): void => {
            comboboxLoadData.value = config.fn ?? null;
            mode.value = config.queryMode;
            pageSize.value = config.pageSize;

            if (config.staticData !== rawData.value) {
                rawData.value = config.staticData ? [...config.staticData] : [];
                data.value = config.staticData ? [...config.staticData] : [];
            }
        };

        /**
         * reset — Đưa store về trạng thái ban đầu.
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

        return { data, loading, loadingMore, hasMore, loadData, loadNextPage, configure, syncConfig, reset };
    });

    const instance = store();

    if (options) {
        const resolvedMode: QueryMode = options.queryMode ?? (options.data ? "local" : "remote");

        instance.syncConfig({
            fn: options.comboboxLoadData ?? null,
            staticData: options.data ?? null,
            queryMode: resolvedMode,
            pageSize: options.pageSize ?? 20,
        });
    }

    return instance;
}

export type ComboboxStoreInstance = ReturnType<typeof useComboboxStore>;
