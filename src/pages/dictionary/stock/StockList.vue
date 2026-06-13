<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nStock.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">
                    {{ $t("i18nStock.List.AddStock") }}
                </BaseButton>
            </div>
        </div>

        <div class="page-content">
            <div class="flex justify-between search-bar">
                <div class="flex gap-2"></div>
                <div class="flex gap-2">
                    <BaseInput size="sm" :placeholder="$t('i18nCommon.SearchPlaceholder')" @input="onSearch" />
                    <BaseButton size="sm" @click="refresh" icon-left="icon-refresh rotate-y-180"></BaseButton>
                    <BaseButton size="sm" icon-left="icon-filter" @click="deleteItem"></BaseButton>
                    <BaseButton size="sm" icon-left="icon-setting scale-[0.85]"></BaseButton>
                </div>
            </div>

            <div class="table-container">
                <BaseTable
                    :store="tableStore"
                    :auto-load="false"
                    :show-selection="true"
                    :empty-text="$t('i18nStock.List.EmptyData')"
                    @row-action-click="onListItemAction"
                >
                    <template #cell-Status="{ row }">
                        <StatusTag :status="row.Status" status-default="Inactive" />
                    </template>
                </BaseTable>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import stockAPI from "@/api/modules/dictionary/stockAPI";
import StockModel from "@/models/dictionary/stock";

export default defineComponent({
    name: "StockList",

    setup() {
        const { proxy } = getCurrentInstance() as any;

        /**
         * Kiểm tra điều kiện hợp lệ trước khi thực hiện xóa
         */
        const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
            if (payload.ids.length === 0) return false;
            return true;
        };

        /**
         * Store quản lý trạng thái và dữ liệu của bảng kho.
         * Cấu hình chế độ truy vấn dữ liệu từ server và hàm tải dữ liệu.
         */
        const tableStore = useTableStore("stock", {
            keyID: "StockID",
            viewOrTableName: "di_stock",
            tableLoadData: (payload) => loadListData(payload),
        });

        /**
         * Sử dụng composable useBaseList để xử lý logic chung cho các trang danh sách, bao gồm:
         * - Tải dữ liệu với phân trang, sắp xếp, lọc.
         * - Xử lý tìm kiếm, làm mới, xóa hàng loạt.
         */
        const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<StockModel>({
            formID: "StockList",
            tableStore,
            api: stockAPI,
            validateBeforeDelete,
        });

        return {
            tableStore,
            onSearch,
            refresh,
            deleteItem,
            onListItemAction,
            createItem,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
