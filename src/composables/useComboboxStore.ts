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
export type ComboboxLoadData = (keyword: string) => Promise<Array<any>>;

export interface ComboboxStoreOptions {
    /**
     * Dữ liệu tĩnh — dùng cho local mode.
     * Store sẽ filter trực tiếp trên mảng này, không gọi API.
     */
    data?: Array<any>;
    /**
     * Hàm gọi API — chỉ dùng cho remote mode.
     */
    comboboxLoadData?: ComboboxLoadData;
    /** default: "local" nếu có data, "remote" nếu có comboboxLoadData */
    queryMode?: QueryMode;
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
        /** Trạng thái đang tải */
        const loading = ref<boolean>(false);

        // ── Internal state ────────────────────────────────────────────────────
        /**
         * Toàn bộ data gốc — chỉ dùng cho local mode.
         * Được set 1 lần từ options.data, các lần sau filter trực tiếp.
         */
        const rawData = ref<Array<any>>([]);

        /**
         * Hàm load data — PHẢI là ref, không dùng let.
         * Nếu dùng let, giá trị sẽ bị mất khi Pinia reuse instance
         * (setup chỉ chạy 1 lần, syncConfig cập nhật ref.value).
         */
        const comboboxLoadData = ref<ComboboxLoadData | null>(null);

        /**
         * Query mode — PHẢI là ref, cùng lý do với comboboxLoadData.
         */
        const mode = ref<QueryMode>("remote");

        // ── Actions ───────────────────────────────────────────────────────────

        /**
         * loadData — Tải và lọc data theo keyword.
         *
         * Local mode : filter trực tiếp trên rawData (đã được seed từ options.data).
         * Remote mode: gọi API mỗi lần, không cache.
         */
        const loadData = async (keyword: string, displayField?: string): Promise<void> => {
            // LOCAL MODE — filter trên rawData, không gọi API
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

            loading.value = true;
            try {
                data.value = await comboboxLoadData.value(keyword);
            } finally {
                loading.value = false;
            }
        };

        /**
         * configure — Thay đổi config và reset toàn bộ state.
         * Dùng khi nguồn dữ liệu thay đổi động (vd: department → employee list mới).
         */
        const configure = (fn: ComboboxLoadData | null, queryMode: QueryMode, sourceData?: Array<any>): void => {
            comboboxLoadData.value = fn;
            mode.value = queryMode;
            rawData.value = sourceData ? [...sourceData] : [];
            data.value = [];
        };

        /**
         * syncConfig — Chỉ cập nhật config, KHÔNG reset data.
         * Dùng nội bộ trong factory sau mỗi lần store() được gọi,
         * đảm bảo config luôn mới nhất dù component re-render.
         *
         * Với local mode: nếu sourceData thay đổi reference → seed lại rawData và data.
         */
        const syncConfig = (fn: ComboboxLoadData | null, queryMode: QueryMode, sourceData?: Array<any>): void => {
            comboboxLoadData.value = fn;
            mode.value = queryMode;

            if (queryMode === "local" && sourceData) {
                // Chỉ seed lại nếu mảng thay đổi reference (tránh reset không cần thiết)
                if (sourceData !== rawData.value) {
                    rawData.value = [...sourceData];
                    data.value = [...sourceData];
                }
            }
        };

        /**
         * reset — Đưa store về trạng thái ban đầu.
         */
        const reset = (): void => {
            data.value = [];
            rawData.value = [];
            loading.value = false;
        };

        return { data, loading, loadData, configure, syncConfig, reset };
    });

    // Lấy (hoặc tạo) instance — Pinia cache theo storeId
    const instance = store();

    // Luôn sync config sau mỗi lần factory được gọi — tránh mất config khi re-render
    if (options) {
        const resolvedMode: QueryMode = options.queryMode ?? (options.data ? "local" : "remote");

        instance.syncConfig(options.comboboxLoadData ?? null, resolvedMode, options.data);
    }

    return instance;
}

export type ComboboxStoreInstance = ReturnType<typeof useComboboxStore>;
