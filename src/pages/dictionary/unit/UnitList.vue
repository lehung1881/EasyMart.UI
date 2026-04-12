<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nUnit.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">{{
                    $t("i18nUnit.List.AddUnit")
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
                </div>
            </div>

            <div class="table-container">
                <BaseTable
                    :store="tableStore"
                    :columns="tableColumns"
                    :auto-load="false"
                    :show-selection="true"
                    :empty-text="$t('i18nUnit.List.EmptyData')"
                    @row-action-click="onListItemAction"
                >
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
import unitAPI from "@/api/modules/dictionary/unitAPI";
import UnitModel from "@/models/dictionary/unit";

const searchKeyword = ref<string>("");
const { proxy } = getCurrentInstance() as any;

const tableColumns: ColumnDefinition[] = [
    {
        dataField: "UnitName",
        title: proxy.$t("i18nUnit.List.UnitName"),
        width: 200,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "Description",
        title: proxy.$t("i18nCommon.Description"),
        // width: 600,
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

const tableStore = useTableStore("unit", {
    keyID: "UnitID",
    viewOrTableName: "di_unit",
    columns: tableColumns,
    tableLoadData: (payload) => loadListData(payload),
});

const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<UnitModel>({
    formID: "UnitList",
    tableStore,
    api: unitAPI,
    rowKey: "UnitID",
    validateBeforeDelete,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
