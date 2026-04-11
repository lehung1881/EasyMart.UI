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
                    <BaseInput
                        v-model="searchKeyword"
                        size="sm"
                        :placeholder="$t('i18nCommon.SearchPlaceholder')"
                        @change="onSearch"
                    />
                    <BaseButton size="sm" @click="refresh" icon-left="icon-refresh rotate-y-180"></BaseButton>
                    <BaseButton size="sm" icon-left="icon-filter" @click="deleteItem"></BaseButton>
                    <BaseButton size="sm" icon-left="icon-setting scale-[0.85]"></BaseButton>
                </div>
            </div>

            <div class="table-container">
                <BaseTable
                    :store="tableStore"
                    :columns="tableColumns"
                    :auto-load="false"
                    :show-selection="true"
                    :empty-text="$t('i18nStock.List.EmptyData')"
                    @row-action-click="onListItemAction"
                >
                    <template #cell-Status="{ row }">
                        <span :class="`status-${row.Status === 1 ? 'active' : 'inactive'}`">
                            {{ row.Status === 1 ? $t("i18nCommon.Active") : $t("i18nCommon.Inactive") }}
                        </span>
                    </template>
                </BaseTable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import stockAPI from "@/api/modules/dictionary/stockAPI";
import StockModel from "@/models/dictionary/stock";

const searchKeyword = ref<string>("");
const { proxy } = getCurrentInstance() as any;

const tableColumns: ColumnDefinition[] = [
    {
        dataField: "StockCode",
        title: proxy.$t("i18nStock.List.StockCode"),
        width: 150,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "StockName",
        title: proxy.$t("i18nStock.List.StockName"),
        width: 250,
        align: "left",
        visible: true,
        sortOrder: 2,
    },
    {
        dataField: "Address",
        title: proxy.$t("i18nStock.List.Address"),
        width: 300,
        align: "left",
        visible: true,
    },
    {
        dataField: "Description",
        title: proxy.$t("i18nCommon.Description"),
        // width: 200,
        align: "left",
        visible: true,
    },
    {
        dataField: "Status",
        title: proxy.$t("i18nCommon.Status"),
        width: 150,
        align: "center",
        visible: true,
    },
];

const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) return false;
    return true;
};

const tableStore = useTableStore("stock", {
    keyID: "StockID",
    viewOrTableName: "di_stock",
    columns: tableColumns,
    tableLoadData: (payload) => loadListData(payload),
});

const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<StockModel>({
    formID: "StockList",
    tableStore,
    api: stockAPI,
    rowKey: "StockID",
    validateBeforeDelete,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>

