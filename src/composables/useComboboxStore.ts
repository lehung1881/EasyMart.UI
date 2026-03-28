/**
 * useComboboxStore.ts
 * Data layer - Pinia factory store cho BaseCombobox.
 * Mỗi storeID tạo một instance độc lập; gọi cùng storeID trả về cùng instance.
 */

import { ref } from "vue";
import { defineStore } from "pinia";
import commonFunction from "@/commons/commonFunction";
import { DataType, FilterOperator } from "@/constants";
import type { FilterCondition, PagingRequest } from "@/models/common/paging";
import type BaseAPI from "@/api/baseAPI";
import type { ComboboxLoadData, ComboboxStoreOptions, QueryMode } from "@/models/common/combobox";
import type { ColumnDefinition } from "@/models/common/columnDefinition";

const STORE_NAME_TEMPLATE = "combobox_{0}_{1}";

/**
 * Tạo và lấy instance store cho combobox theo storeID.
 * @param storeID Định danh store.
 * @param options Cấu hình khởi tạo store.
 * @returns Instance store cho combobox.
 */
export const useComboboxStore = (storeID: string, options: ComboboxStoreOptions) => {
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

        /** Object đang được chọn trong combobox */
        const selectedItem = ref<any>(null);

        /** Object cũ được chọn trong combobox */
        const oldSelectedItem = ref<any>(null);

        /** Giá trị đang được chọn trong combobox */
        const selectedValue = ref<any>(null);

        /** Field hiển thị text trong input và dropdown */
        const displayField = ref<string>("");

        /** Field dùng làm value khi emit */
        const valueField = ref<string>("");

        /** Cấu hình cột hiển thị cho dropdown dùng bằng */
        const columns = ref<ColumnDefinition[]>([]);

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
        const currentTextSearch = ref<string>("");

        /** Danh sách field search cấu hình từ bên ngoài */
        const configuredSearchFields = ref<Array<string>>([]);

        /** View/Table name gửi BE */
        const viewName = ref<string>("");

        // Private helpers

        /**
         * Tạo filter text search từ keyword, searchField và displayField.
         * Gộp searchFields với displayField (dedup, bỏ rỗng) rồi tạo FilterCondition cho từng field.
         * @param searchFields Danh sách field search cấu hình.
         * @returns Mảng FilterCondition, rỗng nếu chưa có keyword hoặc không có field nào hợp lệ.
         */
        const buildTextSearchFilter = (searchFields: Array<string>): Array<FilterCondition> => {
            const keyword = currentTextSearch.value.trim();
            if (!keyword) return [];

            const mergedFields = new Set<string>();
            searchFields.forEach((f) => {
                if (f.trim()) mergedFields.add(f.trim());
            });
            // Gộp displayField vào search fields
            if (displayField.value.trim()) mergedFields.add(displayField.value.trim());

            if (mergedFields.size === 0) return [];

            return Array.from(mergedFields).map((field) => ({
                property: field,
                value: keyword,
                operator: FilterOperator.Contains,
                operand: 1,
                dataType: DataType.String,
            }));
        };

        /**
         * Tạo payload chuẩn gửi BE.
         * @param pageIndex Trang cần tải.
         * @returns Payload phân trang/filter.
         */
        const buildPayload = (pageIndex: number): PagingRequest => ({
            pageIndex,
            pageSize: pageSize.value,
            sort: [],
            filter: buildTextSearchFilter(configuredSearchFields.value),
            columns: "",
            viewOrTableName: viewName.value,
            selectedValue: getSelectedValueForPayload(),
        });

        /**
         * Lấy selectedValue để đưa vào payload gửi BE, giúp BE biết giá trị nào đang được chọn (vd: để exclude khỏi kết quả).
         * @returns Selected value dạng payload, hoặc null nếu không có giá trị.
         */
        const getSelectedValueForPayload = (): any => {
            if (selectedValue.value == null) return null;
            return {
                property: valueField.value,
                value: selectedValue.value,
                dataType: DataType.String,
            };
        };

        /**
         * Kiểm tra có phải remote mode không.
         * @returns True nếu là remote mode.
         */
        const isRemoteMode = (): boolean => mode.value === "remote";

        /**
         * Kiểm tra còn data để load thêm.
         * @param result Kết quả vừa load.
         * @returns Không trả về giá trị.
         */
        const updateHasMore = (result: Array<any>): void => {
            hasMore.value = result.length >= pageSize.value;
        };

        // Actions

        /**
         * Load trang đầu tiên hoặc reset khi keyword đổi.
         * @param keyword Từ khóa tìm kiếm.
         * @returns Promise hoàn tất load data.
         */
        const loadData = async (keyword: string): Promise<void> => {
            const displayFieldValue = displayField.value;

            // LOCAL MODE
            if (!isRemoteMode()) {
                if (!keyword || !displayFieldValue) {
                    data.value = [...rawData.value];
                } else {
                    const kw = keyword.toLowerCase();
                    data.value = rawData.value.filter((item) =>
                        String(item[displayFieldValue]).toLowerCase().includes(kw),
                    );
                }
                return;
            }

            // REMOTE MODE
            if (!loadFn.value) return;

            // Gán keyword, reset paging
            currentTextSearch.value = keyword;
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
         * Load thêm trang tiếp theo (infinite scroll), chỉ cho remote mode.
         * @returns Promise hoàn tất load thêm.
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
         * Đồng bộ config nhưng không reset data.
         * @param config Cấu hình mới cho store.
         * @returns Không trả về giá trị.
         */
        const initConfigStore = (config: ComboboxStoreOptions): void => {
            loadFn.value = config.comboboxLoadData ?? null;
            mode.value = config.queryMode ?? (config.data ? "local" : "remote");
            pageSize.value = config.pageSize ?? 20;
            viewName.value = config.viewOrTableName ?? "";

            const uniqueFields = new Set<string>();
            (config.searchField ?? []).forEach((f) => {
                if (f.trim()) uniqueFields.add(f.trim());
            });
            configuredSearchFields.value = Array.from(uniqueFields);

            if (config.data !== rawData.value) {
                rawData.value = config.data ? [...config.data] : [];
                data.value = config.data ? [...config.data] : [];
            }

            displayField.value = config.displayField;
            valueField.value = config.valueField;
            columns.value = config.columns ?? [];
        };

        /**
         * Gán object được chọn vào selectedItem.
         * @param item Object được chọn, hoặc null để xóa lựa chọn.
         * @returns Không trả về giá trị.
         */
        const setSelectedItem = (item: any): void => {
            oldSelectedItem.value = selectedItem.value ? { ...selectedItem.value } : null;
            selectedItem.value = item ?? null;
            const vf = valueField.value;
            selectedValue.value = item && vf ? item[vf] : null;
        };

        /**
         * Đưa store về trạng thái ban đầu.
         * @returns Không trả về giá trị.
         */
        const reset = (): void => {
            data.value = [];
            rawData.value = [];

            loading.value = false;
            loadingMore.value = false;
            hasMore.value = false;

            currentPage.value = 1;
            currentTextSearch.value = "";
            selectedItem.value = null;
            oldSelectedItem.value = null;
            selectedValue.value = null;
        };

        return {
            data,
            loading,
            loadingMore,
            hasMore,
            selectedItem,
            oldSelectedItem,
            selectedValue,
            displayField,
            valueField,
            columns,
            loadData,
            loadNextPage,
            initConfigStore,
            setSelectedItem,
            reset,
        };
    });

    const instance = store();

    // Init options
    if (options) {
        instance.initConfigStore(options);
    }

    return instance;
};

export type ComboboxStoreInstance = ReturnType<typeof useComboboxStore>;

/**
 * Hàm lấy data cho combobox ở remote mode, dùng chung để truyền vào store.
 * @param api Instance của BaseAPI hoặc class con kế thừa.
 * @param payload Payload chuẩn gửi BE, store sẽ gọi hàm này với payload đã build sẵn.
 * @returns Mảng data trả về từ BE, hoặc mảng rỗng nếu lỗi.
 */
export const loadDataRemoteCombobox = async (api: BaseAPI, payload: PagingRequest) => {
    const response = await api.getDataCombobox(payload);
    return response.Data?.PageData ?? [];
};
