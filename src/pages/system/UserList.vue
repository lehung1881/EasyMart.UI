<template>
    <div class="page-content-user">
        <div class="flex justify-between search-bar">
            <div>
                <BaseInput size="sm" :placeholder="$t('i18nCommon.SearchPlaceholder')" @input="onSearch" />
            </div>
            <div class="flex gap-2">
                <BaseButton size="sm" @click="refresh" icon-left="icon-refresh rotate-y-180"></BaseButton>
                <BaseButton size="sm" icon-left="icon-filter" @click="deleteItem"></BaseButton>
                <BaseButton icon-left="icon-plus-white" size="sm" variant="primary" @click="createItem">
                    {{ $t("i18nCommon.AddNew") }}
                </BaseButton>
            </div>
        </div>

        <div class="table-container">
            <BaseTable
                :store="tableStore"
                :auto-load="false"
                :show-selection="false"
                :empty-text="$t('i18nCommon.EmptyData')"
                @row-action-click="onItemAction"
                :listRowAction="listRowAction"
            >
                <template #cell-FullName="{ row }">
                    <div class="flex items-center gap-3" style="padding: 12px 0">
                        <UserAvatar :full-name="row.FullName" :avatar-url="row.AvatarUrl" :size="36" shape="circle" />
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ row.FullName }}</span>
                            <span class="text-xs text-gray-500 flex items-center gap-1">
                                {{ row.Email }}
                            </span>
                        </div>
                    </div>
                </template>
                <template #cell-Gender="{ row }">
                    <StatusTag :status="row.Gender" :list-status="gendorStatus" :hasDot="false" />
                </template>
                <template #cell-Status="{ row }">
                    <StatusTag :status="row.Status" :list-status="statusUsers" />
                </template>
                <template #cell-RoleName="{ row }">
                    <div class="w-full">
                        <div class="flex gap-2" v-if="!row.edited">
                            <div>{{ row.RoleName }}</div>
                        </div>
                        <div v-else class="flex items-center gap-3">
                            <div class="w-[256px]">
                                <BaseCombobox
                                    v-model="row.RoleID"
                                    :store="roleStore"
                                    :autoLoad="false"
                                    clearIcon
                                    :initText="row.RoleName"
                                    @selected="(item: any) => roleSelected(item, row)"
                                    @change="(item: any) => roleChange(item, row)"
                                    class="w-[256px]"
                                />
                            </div>
                            <div class="flex gap-2">
                                <div class="icon-circle-close" @click="cancelSave(row)"></div>
                                <div class="icon-circle-tick" @click="saveUserRole(row)"></div>
                            </div>
                        </div>
                    </div>
                </template>
            </BaseTable>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from "vue";
import { useBaseList, type ValidateBeforeDeletePayload } from "@/composables/base/useBaseList";
import { useTableStore } from "@/composables/controls/useTableStore";
import userAPI from "@/api/modules/system/userAPI";
import SysMscUser from "@/models/system/SysMscUser";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/controls/useComboboxStore";
import { ModelState } from "@/constants";
import SysMscRole from "@/models/system/SysMscRole";
import UserAvatar from "@/components/common/UserAvatar.vue";
export default defineComponent({
    name: "UserList",
    components: {
        UserAvatar,
    },
    setup() {
        const statusUsers = [
            {
                value: 0,
                text: "Đang hoạt động",
                variant: "success",
            },
            {
                value: 1,
                text: "Ngừng hoạt động",
                variant: "danger",
            },
            {
                value: 2,
                text: "Chờ xác nhận",
                variant: "warning",
            },
        ];
        const gendorStatus = [
            {
                value: 0,
                text: "Nam",
                variant: "success",
            },
            {
                value: 1,
                text: "Nữ",
                variant: "info",
            },
        ];
        /**
         * lvhung - 15.06.2026
         * Validate danh sách ID trước khi thực hiện xóa.
         */
        const validateBeforeDelete = async (payload: ValidateBeforeDeletePayload): Promise<boolean> => {
            if (payload.ids.length === 0) return false;
            return true;
        };

        const tableStore = useTableStore("user", {
            keyID: "UserID",
            viewOrTableName: "sys_msc_user",
            tableLoadData: (payload) => loadListData(payload),
            modelClass: SysMscUser,
            sorts: [
                {
                    property: "IsSystem",
                    desc: true,
                },
                {
                    property: "FullName",
                    desc: false,
                },
            ],
        });

        /**
         * Store cho combobox đơn vị tính
         */
        const roleStore = useComboboxStore("role_combobox", {
            viewOrTableName: "sys_msc_role",
            modelClass: SysMscRole,
            comboboxLoadData: (pay) => {
                pay.sort = [
                    {
                        property: "IsSystem",
                        desc: true,
                    },
                    {
                        property: "RoleName",
                        desc: false,
                    },
                ];
                return loadDataRemoteCombobox(userAPI, pay);
            },
            displayField: "RoleName",
            valueField: "RoleID",
            columns: [
                { dataField: "RoleCode", title: "Mã vai trò", width: 120 },
                { dataField: "RoleName", title: "Tên vai trò", width: 180 },
            ],
            dropdownWidth: 400,
        });

        /**
         * lvhung - 15.06.2026
         * Lấy chữ viết tắt từ họ tên để hiển thị avatar fallback.
         * VD: "Nguyễn Chí Hùng" → "NH"
         */
        const getAvatarInitials = (fullName: string): string => {
            if (!fullName) return "?";
            const words = fullName.trim().split(/\s+/);
            if (words.length === 1) return words[0]![0]!.toUpperCase();
            return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
        };

        /**
         * lvhung - 15.06.2026
         * Sinh màu nền avatar dựa theo tên, đảm bảo cùng tên luôn ra cùng màu.
         */
        const getAvatarColor = (fullName: string): string => {
            const colorPalette = [
                "#E8724A",
                "#4F86C6",
                "#5BAD8F",
                "#E05B8A",
                "#9B6BB5",
                "#7B8FA1",
                "#4AAFB8",
                "#D4A843",
            ];
            if (!fullName) return colorPalette[0]!;
            const hashCode = [...fullName].reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colorPalette[hashCode % colorPalette.length]!;
        };

        /**
         * Cập nhật vai trò cho người dùng
         * @param row
         */
        const saveUserRole = async (row: any) => {
            row.ModelState = ModelState.Update;
            const saveResult = await userAPI.saveData(row);
            if (saveResult && saveResult.Success) {
                row.edited = false;
            }
        };

        /**
         * Hủy cập nhật
         * @param row
         */
        const cancelSave = (row: any) => {
            row.edited = false;
            if (!(row instanceof SysMscUser)) return;
            row.rollbackChange();
        };

        /**
         * Xử lý chọn vai trò
         * @param item
         * @param row
         */
        const roleSelected = (item: any, row: any) => {
            if (item) {
                row.RoleCode = item.RoleCode;
                row.RoleName = item.RoleName;
            }
        };

        /**
         * Xử lý thay đổi vai trò
         * @param item
         * @param row
         */
        const roleChange = (item: any, row: any) => {
            if (item) {
                row.RoleCode = item.RoleCode;
                row.RoleName = item.RoleName;
            } else {
                row.RoleCode = null;
                row.RoleName = null;
            }
        };

        const { loadListData, onSearch, refresh, deleteItem, onListItemAction, createItem } = useBaseList<SysMscUser>({
            formID: "UserList",
            tableStore,
            api: userAPI,
            validateBeforeDelete,
        });

        /**
         * Xử lý action thao tác trên từng dòng dữ liệu danh sách.
         * @param action Action được click từ danh sách.
         * @param row Bản ghi tương ứng với action.
         * @returns Không trả về giá trị.
         */
        const onItemAction = (rowAction: any, rowData: any): void => {
            switch (rowAction.actionName) {
                case "Edit":
                    rowData.edited = true;
                    break;
                case "Delete":
                    deleteItem(rowData);
                    break;
                default:
                    break;
            }
        };

        const listRowAction = reactive([
            {
                actionName: "Edit",
                icon: "icon-row-edit scale-[0.9]",
                show: (row: any) => {
                    return !row.IsSystem;
                },
            },
            {
                actionName: "Delete",
                icon: "icon-row-delete scale-[0.9]",
                show: (row: any) => {
                    return !row.IsSystem;
                },
            },
        ]);

        return {
            tableStore,
            statusUsers,
            gendorStatus,
            roleStore,
            listRowAction,
            onSearch,
            refresh,
            deleteItem,
            onItemAction,
            onListItemAction,
            createItem,
            getAvatarInitials,
            getAvatarColor,
            roleSelected,
            roleChange,
            saveUserRole,
            cancelSave,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
.page-content-user {
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
