<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nUnit.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">
                    {{ $t("i18nUnit.List.AddUnit") }}
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
                </div>
            </div>

            <div class="table-container">
                <BaseTable
                    :store="tableStore"
                    :auto-load="false"
                    :show-selection="true"
                    :empty-text="$t('i18nUnit.List.EmptyData')"
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
import unitAPI from "@/api/modules/dictionary/unitAPI";
import UnitModel from "@/models/dictionary/unit";

export default defineComponent({
    name: "UnitList",

    setup() {
        const { proxy } = getCurrentInstance() as any;

        /**
         * Validate danh sách ID trước khi thực hiện xóa.
         */
        const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
            if (payload.ids.length === 0) return false;
            return true;
        };

        /**
         * Store quản lý trạng thái và dữ liệu của bảng đơn vị tính.
         */
        const tableStore = useTableStore("unit", {
            keyID: "UnitID",
            viewOrTableName: "di_unit",
            tableLoadData: (payload) => loadListData(payload),
        });

        const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<UnitModel>({
            formID: "UnitList",
            tableStore,
            api: unitAPI,
            validateBeforeDelete,
        });

        // Trả ra các thuộc tính và hàm để sử dụng ngoài template
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