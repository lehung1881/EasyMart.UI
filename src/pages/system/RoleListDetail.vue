<template>
    <div class="role-screen">
        <!-- CỘT TRÁI: DANH SÁCH VAI TRÒ -->
        <div class="flex flex-col role-panel">
            <div class="panel-header">
                <div class="role-title-row">
                    <h2 class="role-detail-title">Vai trò</h2>
                </div>
            </div>

            <!-- Form tạo vai trò mới -->
            <div v-if="isCreating" class="create-role-form">
                <div class="form-fields">
                    <BaseInput
                        label="Tên vai trò"
                        type="text"
                        required
                        placeholder="Ví dụ: Nhân viên Marketing"
                        v-model="newRoleName"
                    />
                    <BaseTextArea
                        label="Mô tả nhiệm vụ"
                        placeholder="Mô tả tóm tắt trách nhiệm của nhóm vai trò này"
                        v-model="newRoleDesc"
                        rows="2"
                    />
                    <div class="form-actions">
                        <BaseButton size="md" @click="isCreating = false">Huỷ bỏ</BaseButton>
                        <BaseButton size="md" variant="primary">Xác nhận</BaseButton>
                    </div>
                </div>
            </div>

            <div class="role-list flex-1" v-else>
                <div
                    v-for="role in rolesList"
                    :key="role.RoleID"
                    @click="selectRole(role)"
                    :class="['role-item', role.RoleID === currentRole.RoleID ? 'active' : '']"
                >
                    <div class="role-item-content">
                        <div class="role-item-left">
                            <div class="role-title-wrapper">
                                <span :class="['role-name', role.RoleID === currentRole.RoleID ? 'active' : '']">
                                    {{ role.RoleName }}
                                </span>
                            </div>
                            <p class="role-desc">{{ role.Description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CỘT PHẢI: CHI TIẾT VAI TRÒ -->
        <div class="flex flex-col flex-1 detail-panel">
            <div class="panel-header">
                <div class="role-title-row">
                    <h2 class="role-detail-title">{{ currentRole?.RoleName }}</h2>
                </div>
            </div>

            <div class="search-container">
                <BaseInput
                    type="text"
                    :placeholder="$t('i18nCommon.SearchPlaceholder')"
                    class="!w-[250px]"
                    @input="onPermissionSearch"
                />
            </div>

            <div class="permissions-container flex-1">
                <div v-for="group in filteredPermissionMappings" :key="group.RoleID" class="group-card">
                    <div class="group-header">
                        <div class="group-title-info">
                            <div class="group-title-row">
                                <h4 class="group-title">
                                    {{ $t(`i18nSystem.${group.SubSystemCode}.Title`) }}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <div class="permission-rows grid grid-cols-12">
                        <div v-for="(val, action) in group.ListPermissionObject" :key="action" class="col-span-3">
                            <BaseCheckbox
                                :disabled="currentRole.IsSystem"
                                size="sm"
                                v-model="group.ListPermissionObject[action]"
                                :label="$t(`i18nSystem.${group.SubSystemCode}.${action}`)"
                            />
                        </div>
                    </div>
                </div>

                <div v-if="filteredPermissionMappings.length === 0" class="empty-state">
                    <p class="empty-title">Không tìm thấy quyền hạn nào phù hợp từ khoá</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { debounce } from "lodash";
import { defaultSubSystem } from "@/constants/staticConfig/MscSubSystem";
import { useTableStore, loadDataRemoteTable } from "@/composables/controls/useTableStore";
import RoleAPI from "@/api/modules/system/RoleAPI.ts";
import SysMscRole from "@/models/system/SysMscRole.ts";
import SysMscRolePermissionMapping from "@/models/system/SysMscRolePermissionMapping.ts";

interface RoleData {
    RoleID: string;
    RoleName: string;
    Description: string;
    IsSystem: boolean;
}

export default defineComponent({
    name: "RoleList",

    setup() {
        const { t } = useI18n();

        const rolesList = ref<RoleData[]>([]);
        const currentRole = ref<SysMscRole>(new SysMscRole());
        const permissionSearchKeyword = ref("");
        const isCreating = ref(false);
        const newRoleName = ref("");
        const newRoleDesc = ref("");

        const tableStore = useTableStore("role", {
            keyID: "RoleID",
            viewOrTableName: "sys_msc_role",
            tableLoadData: (payload) => loadDataRemoteTable(RoleAPI, payload),
        });

        /**
         * Danh sách permission mapping đã được lọc theo từ khóa tìm kiếm.
         * Tìm theo title phân hệ và tên từng action.
         */
        const filteredPermissionMappings = computed(() => {
            const keyword = permissionSearchKeyword.value;
            if (!keyword) return currentRole.value.SysMscRolePermissionMapping ?? [];

            return (currentRole.value.SysMscRolePermissionMapping ?? []).filter((group) => {
                const groupTitle = t(`i18nSystem.${group.SubSystemCode}.Title`).toLowerCase();
                if (groupTitle.includes(keyword)) return true;

                return Object.keys(group.ListPermissionObject ?? {}).some((action) => {
                    const actionLabel = t(`i18nSystem.${group.SubSystemCode}.${action}`).toLowerCase();
                    return actionLabel.includes(keyword);
                });
            });
        });

        /**
         * Xây dựng danh sách permission mapping từ defaultSubSystem,
         * đè lại bằng dữ liệu thực tế từ server nếu đã tồn tại.
         */
        const buildPermissionMappings = (
            roleID: string,
            serverMappings: SysMscRolePermissionMapping[],
        ): SysMscRolePermissionMapping[] => {
            return Object.values(defaultSubSystem).map((defaultPermission) => {
                const detail = new SysMscRolePermissionMapping();
                detail.RoleID = roleID;
                detail.SubSystemCode = defaultPermission.SubSystemCode;

                const existPermission = serverMappings.find(
                    (item) => item.SubSystemCode === defaultPermission.SubSystemCode,
                );

                if (existPermission) {
                    detail.ID = existPermission.ID;
                    detail.ListPermission = existPermission.ListPermission;
                    detail.ListPermissionObject = existPermission.ListPermissionObject;
                } else {
                    detail.ensurePrimaryKeyValue();
                    detail.ListPermission = JSON.stringify(defaultPermission.ListPermission);
                    detail.ListPermissionObject = defaultPermission.ListPermission;
                }

                detail.commit();
                return detail;
            });
        };

        /**
         * Khởi tạo vai trò mới kèm danh sách permission mapping mặc định.
         */
        const buildNewRole = (): SysMscRole => {
            const role = new SysMscRole();
            role.ensurePrimaryKeyValue();

            role.SysMscRolePermissionMapping = Object.values(defaultSubSystem).map((defaultPermission) => {
                const detail = new SysMscRolePermissionMapping();
                detail.RoleID = role.RoleID;
                detail.SubSystemCode = defaultPermission.SubSystemCode;
                detail.ListPermission = JSON.stringify(defaultPermission.ListPermission);
                detail.ListPermissionObject = defaultPermission.ListPermission;

                detail.commit();
                return detail;
            });

            return role;
        };

        /**
         * Tải danh sách vai trò từ server.
         */
        const loadRolesAsync = async () => {
            await tableStore.loadData();
            rolesList.value = tableStore.data as unknown as RoleData[];
        };

        /**
         * Chọn vai trò và tải chi tiết từ server.
         */
        const selectRole = async (role: RoleData) => {
            if (role.RoleID == currentRole.value.RoleID) return;

            const res = await RoleAPI.getMasterDetail<SysMscRole>(role.RoleID);
            if (!res.Success || !res.Data) return;

            currentRole.value = new SysMscRole(res.Data);
            currentRole.value.SysMscRolePermissionMapping = buildPermissionMappings(
                currentRole.value.RoleID,
                res.Data.SysMscRolePermissionMapping,
            );
        };

        /**
         * Cập nhật từ khóa tìm kiếm có debounce 300ms.
         */
        const onPermissionSearch = debounce((value: string) => {
            permissionSearchKeyword.value = value.trim().toLowerCase();
        }, 300);

        onMounted(async () => {
            await loadRolesAsync();
            if (rolesList.value.length > 0) {
                await selectRole(rolesList.value[0]!);
            }
        });

        return {
            rolesList,
            currentRole,
            filteredPermissionMappings,
            isCreating,
            newRoleName,
            newRoleDesc,
            onPermissionSearch,
            selectRole,
        };
    },
});
</script>

<style lang="scss" scoped>
@import "@/pages/system/RoleList.scss";
</style>
