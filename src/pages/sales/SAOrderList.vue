<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nSAOrder.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">
                    {{ $t("i18nSAOrder.List.AddOrder") }}
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
                    :empty-text="$t('i18nSAOrder.List.EmptyData')"
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
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import salesAPI from "@/api/modules/salesApi";
import SAOrder from "@/models/sales/SAOrder";

/**
 * Kiểm tra dữ liệu trước khi xóa đơn hàng.
 * @param payload Danh sách bản ghi và ID cần xóa.
 * @returns `true` nếu cho phép xóa, ngược lại `false`.
 */
const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) {
        return false;
    }

    return true;
};

/**
 * Store quản lý dữ liệu cho danh sách đơn hàng bán.
 */
const tableStore = useTableStore("sales_order", {
    keyID: "SAOrderID",
    viewOrTableName: "sa_order",
    tableLoadData: (payload) => loadListData(payload),
});

/**
 * Kế thừa logic chung của màn danh sách đơn hàng.
 */
const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<SAOrder>({
    formID: "SAOrderList",
    tableStore,
    api: salesAPI,
    validateBeforeDelete,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
