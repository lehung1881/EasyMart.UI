<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nCustomer.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">{{
                    $t("i18nCustomer.List.AddCustomer")
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
                    :empty-text="$t('i18nCustomer.List.EmptyData')"
                    @row-action-click="onListItemAction"
                >
                    <template #cell-CustomerType="{ row }">
                        <span>{{
                            row.CustomerType === 1
                                ? $t("i18nCustomer.List.Enterprise")
                                : $t("i18nCustomer.List.Individual")
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
import customerAPI from "@/api/modules/dictionary/customerAPI";
import CustomerModel from "@/models/dictionary/customer";

const searchKeyword = ref<string>("");
const { proxy } = getCurrentInstance() as any;

const tableColumns: ColumnDefinition[] = [
    {
        dataField: "CustomerCode",
        title: proxy.$t("i18nCustomer.List.CustomerCode"),
        width: 160,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "CustomerName",
        title: proxy.$t("i18nCustomer.List.CustomerName"),
        width: 260,
        align: "left",
        visible: true,
        sortOrder: 2,
    },

    {
        dataField: "PhoneNumber",
        title: proxy.$t("i18nCustomer.List.PhoneNumber"),
        width: 150,
        align: "left",
        visible: true,
    },
    { dataField: "Email", title: proxy.$t("i18nCustomer.List.Email"), width: 220, align: "left", visible: true },
    { dataField: "Address", title: proxy.$t("i18nCustomer.List.Address"), align: "left", visible: true },
    {
        dataField: "CustomerType",
        title: proxy.$t("i18nCustomer.List.CustomerType"),
        width: 140,
        align: "left",
        visible: true,
    },
    { dataField: "Status", title: proxy.$t("i18nCommon.Status"), width: 150, align: "center", visible: true },
];

const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) return false;
    return true;
};

const tableStore = useTableStore("customer", {
    keyID: "CustomerID",
    viewOrTableName: "di_customer",
    columns: tableColumns,
    tableLoadData: (payload) => loadListData(payload),
});

const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<CustomerModel>({
    formID: "CustomerList",
    tableStore,
    api: customerAPI,
    rowKey: "CustomerID",
    validateBeforeDelete,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
