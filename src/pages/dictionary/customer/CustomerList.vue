<template>
    <LayoutList>
        <template #page-header>
            <div class="page-title">
                <div class="page-title-line"></div>
                <h1 class="page-title-text">{{ $t("i18nCustomer.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton icon-left="icon-plus-white" size="sm" variant="primary" @click="createItem">
                    {{ $t("i18nCommon.AddNew") }}
                </BaseButton>
            </div>
        </template>
        <template #page-content>
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
                        <StatusTag :status="row.Status" status-default="Inactive" />
                    </template>
                </BaseTable>
            </div>
        </template>
    </LayoutList>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import customerAPI from "@/api/modules/dictionary/customerAPI";
import CustomerModel from "@/models/dictionary/customer";
import LayoutList from "@/pages/common/LayoutList.vue";

export default defineComponent({
    name: "CustomerList",
    components: { LayoutList },
    setup() {
        const { proxy } = getCurrentInstance() as any;

        /**
         * Validate danh sách ID trước khi thực hiện xóa.
         */
        const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
            if (payload.ids.length === 0) return false;
            return true;
        };

        const tableStore = useTableStore("customer", {
            keyID: "CustomerID",
            viewOrTableName: "di_customer",
            tableLoadData: (payload) => loadListData(payload),
        });

        const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } =
            useBaseList<CustomerModel>({
                formID: "CustomerList",
                tableStore,
                api: customerAPI,
                validateBeforeDelete,
            });

        // Trả ra các biến và hàm để sử dụng ngoài <template>
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
