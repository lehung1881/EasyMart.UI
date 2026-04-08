import type { PagingRequest } from "./paging";
import type { ColumnDefinition } from "@/models/common/columnDefinition";

/** Chế độ truy vấn dữ liệu: local (filter trên client) hoặc remote (gọi API) */
export type QueryMode = "local" | "remote";

/** Hàm gọi API lấy data cho combobox, nhận payload phân trang và trả về mảng kết quả */
export type ComboboxLoadData = (payload: PagingRequest) => Promise<Array<any>>;

/**
 * Cấu hình khởi tạo cho combobox store.
 * Dùng khi gọi useComboboxStore(storeID, options) và initConfigStore(config).
 */
export interface ComboboxStoreOptions {
    /** Data tĩnh cho local mode. Nếu có và không chỉ định queryMode thì tự chuyển sang local mode */
    data?: Array<any>;
    /** Hàm gọi API cho remote mode. Store sẽ gọi hàm này với payload đã build sẵn */
    comboboxLoadData?: ComboboxLoadData;
    /** Chế độ truy vấn. Nếu không truyền thì tự suy từ data (có data thì local, không thì remote) */
    queryMode?: QueryMode;
    /** Số bản ghi mỗi trang (remote mode). Default: 20 */
    pageSize?: number;
    /** Tên view/table gửi BE trong payload */
    viewOrTableName?: string;
    /** Danh sách field dùng để search (gộp thêm displayField khi build filter) */
    searchField?: string[];
    /** Field dùng để hiển thị text trong input và dropdown */
    displayField: string;
    /** Field dùng làm value khi emit */
    valueField: string;
    /** Cấu hình cột cho dropdown dạng bảng. Không truyền thì dropdown render dạng list */
    columns?: ColumnDefinition[];
}
