<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nSupplier.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">{{
                    $t("i18nSupplier.List.AddSupplier")
                }}</BaseButton>
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
                    :empty-text="$t('i18nSupplier.List.EmptyData')"
                    @row-action-click="onListItemAction"
                >
                    <template #cell-SupplierType="{ row }">
                        <span>{{
                            row.SupplierType === 1
                                ? $t("i18nSupplier.List.Enterprise")
                                : $t("i18nSupplier.List.Individual")
                        }}</span>
                    </template>
                    <template #cell-Status="{ row }">
                        <span :class="`status-${row.Status === 1 ? 'active' : 'inactive'}`">
                            {{ row.Status === 1 ? $t("i18nCommon.ActiveBusiness") : $t("i18nCommon.InactiveBusiness") }}
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
import supplierAPI from "@/api/modules/dictionary/supplierAPI";
import SupplierModel from "@/models/dictionary/supplier";

const searchKeyword = ref<string>("");
const { proxy } = getCurrentInstance() as any;

const tableColumns: ColumnDefinition[] = [
    {
        dataField: "SupplierCode",
        title: proxy.$t("i18nSupplier.List.SupplierCode"),
        width: 160,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "SupplierName",
        title: proxy.$t("i18nSupplier.List.SupplierName"),
        width: 260,
        align: "left",
        visible: true,
        sortOrder: 2,
    },
    {
        dataField: "SupplierType",
        title: proxy.$t("i18nSupplier.List.SupplierType"),
        width: 140,
        align: "center",
        visible: true,
    },
    {
        dataField: "PhoneNumber",
        title: proxy.$t("i18nSupplier.List.PhoneNumber"),
        width: 150,
        align: "left",
        visible: true,
    },
    { dataField: "Email", title: proxy.$t("i18nSupplier.List.Email"), width: 220, align: "left", visible: true },
    { dataField: "Address", title: proxy.$t("i18nSupplier.List.Address"), align: "left", visible: true },
    { dataField: "Status", title: proxy.$t("i18nCommon.Status"), width: 150, align: "center", visible: true },
];

const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) return false;
    return true;
};

const tableStore = useTableStore("supplier", {
    keyID: "SupplierID",
    viewOrTableName: "di_supplier",
    columns: tableColumns,
    tableLoadData: (payload) => loadListData(payload),
});

const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<SupplierModel>({
    formID: "SupplierList",
    tableStore,
    api: supplierAPI,
    rowKey: "SupplierID",
    validateBeforeDelete,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
