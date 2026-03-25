import type { PagingRequest } from "./paging";

export type QueryMode = "local" | "remote";

export type ComboboxLoadData = (payload: PagingRequest) => Promise<Array<any>>;

export interface ComboboxStoreOptions {
    data?: Array<any>;
    comboboxLoadData?: ComboboxLoadData;
    queryMode?: QueryMode;
    pageSize?: number;
    viewOrTableName?: string;
    searchField?: string[];
}

export interface StoreConfig {
    fn?: ComboboxLoadData | null;
    staticData?: Array<any> | null;
    queryMode: QueryMode;
    pageSize: number;
    viewOrTableName?: string;
    searchField?: string[];
}
