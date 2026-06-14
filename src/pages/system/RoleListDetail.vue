<template>
    <div class="role-screen">
        <!-- CỘT TRÁI: DANH SÁCH VAI TRÒ -->
        <div class="flex flex-col role-panel">
            <div class="panel-header">
                <div class="role-title-row">
                    <h2 class="role-detail-title">Vai trò</h2>
                </div>
            </div>

            <div class="role-list flex-1">
                <div class="role-list-nav">
                    <BaseButton class="w-full" size="md" variant="dash-normal" @click="addRole">Thêm mới</BaseButton>
                    <BaseInput
                        type="text"
                        :placeholder="$t('i18nCommon.SearchPlaceholder')"
                        class="w-full"
                        @input="onRoleSearch"
                    />
                </div>
                <div class="role-list-item">
                    <div
                        v-for="role in filteredRolesList"
                        :key="role.RoleID"
                        @click="selectRole(role as SysMscRole)"
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
                            <div
                                @click.stop="deleteRole"
                                class="icon-row-delete scale-[0.9]"
                                v-if="!role.IsSystem && role.RoleID === currentRole.RoleID"
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- CỘT PHẢI: CHI TIẾT VAI TRÒ -->
        <div class="flex flex-col flex-1 detail-panel">
            <div class="panel-header">
                <div class="role-title-row flex justify-between">
                    <div class="flex">
                        <h2 v-if="!isEditing" class="role-detail-title">{{ currentRole?.RoleName }}</h2>
                        <div v-else class="grid grid-cols-12 gap-3">
                            <div class="col-span-3">
                                <BaseInput
                                    required
                                    v-model="currentRole.RoleCode"
                                    :label="$t('i18nSystem.AddNew.RoleCode')"
                                />
                            </div>
                            <div class="col-span-3">
                                <BaseInput
                                    required
                                    v-model="currentRole.RoleName"
                                    :label="$t('i18nSystem.AddNew.RoleName')"
                                />
                            </div>
                            <div class="col-span-6">
                                <BaseInput v-model="currentRole.Description" :label="$t('i18nCommon.Description')" />
                            </div>
                        </div>
                    </div>
                    <BaseButton
                        v-if="!isEditing && !currentRole.IsSystem"
                        iconLeft="icon-row-edit scale-[0.9]"
                        size="sm"
                        @click="toggleEdit"
                        >Sửa</BaseButton
                    >
                </div>
            </div>

            <div class="search-container flex justify-between">
                <BaseSwitch
                    :disabled="isDisableForm"
                    size="sm"
                    label="Toàn quyền trên phần mềm"
                    :modelValue="isAllPermissionChecked"
                    @update:modelValue="onToggleAllPermission"
                />
                <BaseInput
                    type="text"
                    :placeholder="$t('i18nCommon.SearchPlaceholder')"
                    class="!w-[200px]"
                    @input="onPermissionSearch"
                />
            </div>

            <div class="permissions-container flex-1">
                <div v-for="group in filteredPermissionMappings" :key="group.RoleID" class="group-card">
                    <div class="group-header">
                        <div class="group-title-info flex justify-between">
                            <div class="group-title-row">
                                <h4 class="group-title">
                                    {{ $t(`i18nSystem.${group.SubSystemCode}.Title`) }}
                                </h4>
                            </div>
                            <BaseSwitch
                                :disabled="isDisableForm"
                                size="sm"
                                label="Toàn quyền"
                                :modelValue="isGroupAllChecked(group)"
                                @update:modelValue="(checked: boolean) => onToggleGroupPermission(group, checked)"
                            />
                        </div>
                    </div>

                    <div class="permission-rows grid grid-cols-12">
                        <div v-for="(_, key) in group.ListPermissionObject" :key="key" class="col-span-3">
                            <BaseCheckbox
                                :disabled="isDisableForm"
                                size="sm"
                                v-model="group.ListPermissionObject[key]"
                                :label="$t(`i18nSystem.${group.SubSystemCode}.${key}`)"
                            />
                        </div>
                    </div>
                </div>

                <div v-if="filteredPermissionMappings.length === 0" class="empty-state">
                    <p class="empty-title">Không tìm thấy quyền hạn nào phù hợp từ khoá</p>
                </div>
            </div>
            <div class="detail-panel-footer" v-if="isEditing">
                <BaseButton size="md" @click="cancelRole">
                    {{ $t("i18nCommon.Cancel") }}
                </BaseButton>
                <BaseButton size="md" variant="primary" @click="saveRole">
                    {{ $t("i18nCommon.Save") }}
                </BaseButton>
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
import { usePopup } from "@/composables/popup/usePopup";
import { showConfirm, showWarning } from "@/commons/messageBox";
import BaseButton from "@/components/controls/BaseButton.vue";
import { ModelState } from "@/constants/enumration/modelState";

export default defineComponent({
    name: "RoleList",

    setup() {
        const { t } = useI18n();
        const { show } = usePopup();

        const rolesList = ref<SysMscRole[]>([]);
        const currentRole = ref<SysMscRole>(new SysMscRole());
        const permissionSearchKeyword = ref("");
        const isCreating = ref(false);
        const newRoleName = ref("");
        const newRoleDesc = ref("");
        const isEditing = ref(false);

        const tableStore = useTableStore("role", {
            keyID: "RoleID",
            viewOrTableName: "sys_msc_role",
            tableLoadData: (payload) => loadDataRemoteTable(RoleAPI, payload),
        });

        /**
         * Bật/tắt trạng thái edit.
         */
        const toggleEdit = () => {
            isEditing.value = !isEditing.value;
        };

        /**
         * Disable form
         */
        const isDisableForm = computed(() => {
            if (currentRole.value.IsSystem) return true;
            return !isEditing.value;
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
                    detail.ListPermissionObject = mergeWithDefault(
                        existPermission.ListPermissionObject,
                        defaultPermission.ListPermission,
                    );
                } else {
                    detail.setAutoPrimaryKey();
                    detail.ListPermission = JSON.stringify(defaultPermission.ListPermission);
                    detail.ListPermissionObject = defaultPermission.ListPermission;
                }

                detail.commit();
                return detail;
            });
        };

        /**
         * Merge object a vào object b
         * - c chỉ có các key của b
         * - Giá trị của key là giá trị của a nếu a có, ngược lại lấy giá trị của b
         * @param a - object nguồn (giá trị từ server)
         * @param b - object khuôn mẫu (default)
         * @returns c - object kết quả
         */
        const mergeWithDefault = (a: Record<string, boolean>, b: Record<string, boolean>): Record<string, boolean> => {
            return Object.fromEntries(Object.keys(b).map((key) => [key, key in a ? a[key]! : b[key]!]));
        };

        /**
         * Xử lý mở form thêm vai trò mới
         */
        const addRole = async () => {
            if (hasChange()) {
                const confirmed = await showConfirm("Dữ liệu đã thay đổi, bạn có muốn lưu lại không?");
                if (confirmed) await saveRole();
                else return;
            }
            const newRole = buildNewRole();
            newRole.RoleName = "Vai trò mới";
            newRole.Description = "Mô tả vai trò mới";
            newRole.IsSystem = false;
            newRole.ModelState = ModelState.Insert;

            rolesList.value.push(newRole);

            currentRole.value = newRole;
            isEditing.value = true;
        };

        /**
         * Khởi tạo vai trò mới kèm danh sách permission mapping mặc định.
         */
        const buildNewRole = (): SysMscRole => {
            const role = new SysMscRole();
            role.setAutoPrimaryKey();

            role.SysMscRolePermissionMapping = Object.values(defaultSubSystem).map((defaultPermission) => {
                const detail = new SysMscRolePermissionMapping();
                detail.setAutoPrimaryKey();
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
            rolesList.value = tableStore.data as unknown as SysMscRole[];
        };

        /**
         * Chọn vai trò và tải chi tiết từ server.
         */
        const selectRole = async (role: SysMscRole, skipCheck = false) => {
            if (role.RoleID == currentRole.value.RoleID) return;

            if (!skipCheck && hasChange()) {
                const confirmed = await showConfirm("Dữ liệu đã thay đổi, bạn có muốn lưu lại không?");
                if (confirmed) await saveRole();
                else return;
            }

            isEditing.value = false;

            const res = await RoleAPI.getMasterDetail<SysMscRole>(role.RoleID);
            if (!res.Success || !res.Data) return;

            currentRole.value = new SysMscRole(res.Data);
            currentRole.value.SysMscRolePermissionMapping = buildPermissionMappings(
                currentRole.value.RoleID,
                res.Data.SysMscRolePermissionMapping,
            );
            currentRole.value.commit();
        };

        /**
         * Lưu currentRole lên server.
         */
        const saveRole = async () => {
            if (!validateRole()) return;

            if (currentRole.value.ModelState == ModelState.Insert) {
            }
        };
        /**
         * Validate currentRole trước khi lưu.
         * @returns true nếu hợp lệ, false nếu không
         */
        const validateRole = (): boolean => {
            const validateResult = currentRole.value.validate();
            if (!validateResult.isValid) {
                showWarning(validateResult.errors);
            }

            return true;
        };

        /**
         * Cập nhật từ khóa tìm kiếm có debounce 300ms.
         */
        const onPermissionSearch = debounce((value: string) => {
            permissionSearchKeyword.value = value.trim().toLowerCase();
        }, 300);

        /**
         * Kiểm tra toàn bộ permission đã được check chưa
         */
        const isAllPermissionChecked = computed(() => {
            const mappings = currentRole.value.SysMscRolePermissionMapping ?? [];
            if (mappings.length === 0) return false;
            return mappings.every((group) =>
                Object.values(group.ListPermissionObject ?? {}).every((val) => val === true),
            );
        });

        /**
         * Check/uncheck toàn bộ permission
         */
        const onToggleAllPermission = (checked: boolean) => {
            (currentRole.value.SysMscRolePermissionMapping ?? []).forEach((group) => {
                Object.keys(group.ListPermissionObject ?? {}).forEach((key) => {
                    group.ListPermissionObject[key] = checked;
                });
            });
        };

        /**
         * Kiểm tra toàn bộ permission trong 1 group đã được check chưa
         */
        const isGroupAllChecked = (group: Pick<SysMscRolePermissionMapping, "ListPermissionObject">) => {
            return Object.values(group.ListPermissionObject ?? {}).every((val) => val === true);
        };

        /**
         * Check/uncheck toàn bộ permission trong 1 group
         */
        const onToggleGroupPermission = (
            group: Pick<SysMscRolePermissionMapping, "ListPermissionObject">,
            checked: boolean,
        ) => {
            Object.keys(group.ListPermissionObject ?? {}).forEach((key) => {
                group.ListPermissionObject[key] = checked;
            });
        };

        /**
         * Kiểm tra currentRole có thay đổi không, bao gồm cả các detail mapping.
         * @returns true nếu có thay đổi, false nếu không
         */
        const hasChange = (): boolean => {
            if (currentRole.value.getChange() !== null) return true;

            return (currentRole.value.SysMscRolePermissionMapping ?? []).some(
                (mapping) => mapping.getChange() !== null,
            );
        };

        const roleSearchKeyword = ref("");

        /**
         * Danh sách vai trò đã được lọc theo từ khóa tìm kiếm.
         */
        const filteredRolesList = computed(() => {
            const keyword = roleSearchKeyword.value;
            if (!keyword) return rolesList.value;

            return rolesList.value.filter(
                (role) =>
                    role.RoleName?.toLowerCase().includes(keyword) || role.Description?.toLowerCase().includes(keyword),
            );
        });

        /**
         * Cập nhật từ khóa tìm kiếm vai trò có debounce 300ms.
         */
        const onRoleSearch = debounce((value: string) => {
            roleSearchKeyword.value = value.trim().toLowerCase();
        }, 300);

        const cancelRole = () => {
            // currentRole.value.rollback();
            // (currentRole.value.SysMscRolePermissionMapping ?? []).forEach((mapping) => {
            //     mapping.rollback();
            // });
            isEditing.value = false;
        };

        const deleteRole = async () => {
            if (currentRole.value.ModelState === ModelState.Insert) {
                rolesList.value = rolesList.value.filter((role) => role.RoleID !== currentRole.value.RoleID);

                if (rolesList.value.length > 0) {
                    await selectRole(rolesList.value[0]! as SysMscRole, true);
                } else {
                    currentRole.value = new SysMscRole();
                }

                return;
            }

            // TODO: gọi API xóa nếu là record đã có trên server
        };

        onMounted(async () => {
            await loadRolesAsync();
            if (rolesList.value.length > 0) {
                await selectRole(rolesList.value[0]! as SysMscRole, true);
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
            isAllPermissionChecked,
            filteredRolesList,
            onRoleSearch,
            isEditing,
            isDisableForm,
            onToggleAllPermission,
            isGroupAllChecked,
            onToggleGroupPermission,
            selectRole,
            addRole,
            toggleEdit,
            cancelRole,
            saveRole,
            deleteRole,
        };
    },
});
</script>

<style lang="scss" scoped>
@import "@/pages/system/RoleList.scss";
</style>
