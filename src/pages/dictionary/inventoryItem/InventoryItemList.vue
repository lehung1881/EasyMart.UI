<template>
    <div class="list-page">
        <div class="page-header">
            <div>
                <h1 class="page-title">{{ $t("i18nInventoryItem.List.Title") }}</h1>
            </div>
            <div class="page-actions">
                <BaseButton size="md" variant="primary" @click="createItem">
                    {{ $t("i18nInventoryItem.List.AddInventoryItem") }}
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
                    :empty-text="$t('i18nInventoryItem.List.EmptyData')"
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
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemAPI";
import InventoryItemModel from "@/models/dictionary/inventoryItem";

const { proxy } = getCurrentInstance() as any;

/**
 * Validate nghiệp vụ trước khi xóa hàng hóa.
 * @param payload Dữ liệu validate trước khi xóa.
 * @returns `true` nếu user đồng ý xóa, ngược lại `false`.
 */
const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
    if (payload.ids.length === 0) return false;
    return true;
};

/**
 * Store quản lý trạng thái và dữ liệu của bảng hàng hóa.
 * Cấu hình chế độ truy vấn dữ liệu từ server và hàm tải dữ liệu.
 */
const tableStore = useTableStore("inventory_item", {
    keyID: "InventoryItemID",
    viewOrTableName: "di_inventory_item",
    tableLoadData: (payload) => loadListData(payload),
});

/**
 * Sử dụng composable useBaseList để xử lý logic chung cho các trang danh sách, bao gồm:
 * - loadListData: Hàm tải dữ liệu từ API dựa trên payload của tableStore.
 * - search: Hàm thực hiện tìm kiếm với từ khóa hiện tại.
 */
const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<InventoryItemModel>({
    formID: "InventoryItemList",
    tableStore,
    api: inventoryItemApi,
    validateBeforeDelete,
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
