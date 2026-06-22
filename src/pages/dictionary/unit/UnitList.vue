<template>
    <LayoutList>
        <template #page-header>
            <div class="page-title">
                <div class="page-title-line"></div>
                <h1 class="page-title-text">{{ $t("i18nUnit.List.Title") }}</h1>
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
        </template>
    </LayoutList>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import unitAPI from "@/api/modules/dictionary/unitAPI";
import UnitModel from "@/models/dictionary/unit";
import LayoutList from "@/pages/common/LayoutList.vue";

export default defineComponent({
    name: "UnitList",
    components: { LayoutList },

    /**
     * Khởi tạo trạng thái và các hàm xử lý của màn danh sách đơn vị tính.
     */
    setup() {
        /**
         * Validate danh sách ID trước khi thực hiện xóa.
         * @param payload Dữ liệu validate trước khi xóa.
         * @returns `true` nếu có bản ghi hợp lệ, ngược lại `false`.
         */
        const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
            if (payload.ids.length === 0) return false;
            return true;
        };

        /**
         * Store quản lý trạng thái và dữ liệu của bảng đơn vị tính.
         * Cấu hình khóa chính, tên bảng và hàm tải dữ liệu.
         */
        const tableStore = useTableStore("unit", {
            keyID: "UnitID",
            viewOrTableName: "di_unit",
            tableLoadData: (payload) => loadListData(payload),
        });

        /**
         * Tạo các hàm xử lý danh sách chung cho màn đơn vị tính.
         */
        const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<UnitModel>({
            formID: "UnitList",
            tableStore,
            api: unitAPI,
            validateBeforeDelete,
        });

        /**
         * Trả ra các thuộc tính và hàm để sử dụng ở phần <template>.
         */
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
