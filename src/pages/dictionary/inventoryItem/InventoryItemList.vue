<template>
    <LayoutList>
        <template #page-header>
            <div class="page-title">
                <div class="page-title-line"></div>
                <h1 class="page-title-text">{{ $t("i18nInventoryItem.List.Title") }}</h1>
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
                    <BaseButton size="sm" icon-left="icon-filter" @click="openFilterPopup"></BaseButton>
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
                        <StatusTag :status="row.Status" status-default="Inactive" />
                    </template>
                </BaseTable>
            </div>
        </template>
    </LayoutList>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { usePopup } from "@/composables/popup/usePopup";
import { useTableStore } from "@/composables/controls/useTableStore";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemAPI";
import InventoryItemModel from "@/models/dictionary/inventoryItem";
import LayoutList from "@/pages/common/LayoutList.vue";

export default defineComponent({
    name: "InventoryItemList",
    components: { LayoutList },

    /**
     * Khởi tạo trạng thái và các hàm xử lý của màn danh sách hàng hóa.
     */
    setup() {
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
         * Sử dụng composable useBaseList để xử lý logic chung cho màn danh sách hàng hóa.
         */
        const { loadListData, onSearch, refresh, onListItemAction, createItem } = useBaseList<InventoryItemModel>({
            formID: "InventoryItemList",
            tableStore,
            api: inventoryItemApi,
            validateBeforeDelete,
        });

        const { show } = usePopup();

        /**
         * Mở popup bộ lọc cho danh sách hàng hóa.
         * @returns Không trả về giá trị.
         */
        const openFilterPopup = (): void => {
            show("FilterPopup", {
                columns: tableStore.columns,
                onApply: (payload: {
                    rows: Array<{ field: string | number | null; operator: string | number | null; value: unknown }>;
                }) => {
                    console.log("filter payload", payload);
                },
                onReset: () => {
                    onSearch("");
                },
            });
        };

        /**
         * Trả ra các biến và hàm để sử dụng ở phần <template>.
         */
        return {
            tableStore,
            onSearch,
            refresh,
            onListItemAction,
            createItem,
            openFilterPopup,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
