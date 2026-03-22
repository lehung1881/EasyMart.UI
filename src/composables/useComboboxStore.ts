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
    comboboxLoadData: ComboboxLoadData;
    queryMode?: QueryMode; // default: 'remote'
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const ComboboxStoreName = "Combobox_{0}_{1}";

export function useComboboxStore(storeId: string, options?: ComboboxStoreOptions) {
    /**
     * defineStore với storeId duy nhất — Pinia tự cache instance,
     * setup function chỉ chạy 1 lần duy nhất.
     */
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
         * Được load 1 lần, các lần sau filter trực tiếp.
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

        /**
         * Flag tránh gọi API trùng trong local mode khi đang pending load đầu.
         * '__local__' = đang fetch; '' = chưa fetch hoặc đã xong.
         */
        let pendingKeyword = "";

        // ── Actions ───────────────────────────────────────────────────────────

        /**
         * loadData — Tải và lọc data theo keyword.
         * Local mode : load 1 lần → filter trên rawData.
         * Remote mode: gọi API mỗi lần, không cache.
         */
        const loadData = async (keyword: string, displayField?: string): Promise<void> => {
            if (!comboboxLoadData.value) return;

            // LOCAL MODE
            if (mode.value === "local") {
                // Nếu rawData chưa có → cần fetch lần đầu
                if (rawData.value.length === 0) {
                    // Tránh gọi API trùng khi đang pending
                    if (pendingKeyword === "__local__") return;
                    pendingKeyword = "__local__";

                    loading.value = true;
                    try {
                        rawData.value = await comboboxLoadData.value("");
                    } finally {
                        loading.value = false;
                        pendingKeyword = "";
                    }
                }

                // Filter trực tiếp trên rawData (không gọi API lại)
                if (!keyword || !displayField) {
                    data.value = [...rawData.value];
                } else {
                    const kw = keyword.toLowerCase();
                    data.value = rawData.value.filter((item) => String(item[displayField]).toLowerCase().includes(kw));
                }
                return;
            }

            // REMOTE MODE
            loading.value = true;
            try {
                data.value = await comboboxLoadData.value(keyword);
            } finally {
                loading.value = false;
            }
        };

        /**
         * configure — Thay đổi API function và mode, reset toàn bộ state.
         * Dùng khi API phụ thuộc vào field khác trên form (vd: department → employee).
         */
        const configure = (fn: ComboboxLoadData, queryMode: QueryMode = "remote"): void => {
            comboboxLoadData.value = fn;
            mode.value = queryMode;
            // Reset toàn bộ để force load lại với config mới
            data.value = [];
            rawData.value = [];
            pendingKeyword = "";
        };

        /**
         * syncConfig — Chỉ cập nhật comboboxLoadData và mode, KHÔNG reset data.
         * Dùng nội bộ trong factory sau mỗi lần store() được gọi,
         * đảm bảo config luôn mới nhất dù component re-render.
         */
        const syncConfig = (fn: ComboboxLoadData, queryMode: QueryMode = "remote"): void => {
            comboboxLoadData.value = fn;
            mode.value = queryMode;
        };

        /**
         * reset — Đưa store về trạng thái ban đầu.
         */
        const reset = (): void => {
            data.value = [];
            rawData.value = [];
            loading.value = false;
            pendingKeyword = "";
        };

        return { data, loading, loadData, configure, syncConfig, reset };
    });

    // Lấy (hoặc tạo) instance — Pinia cache theo storeId
    const instance = store();

    // Luôn sync config sau mỗi lần factory được gọi — tránh mất config khi re-render
    if (options?.comboboxLoadData) {
        instance.syncConfig(options.comboboxLoadData, options.queryMode ?? "remote");
    }

    return instance;
}

export type ComboboxStoreInstance = ReturnType<typeof useComboboxStore>;
