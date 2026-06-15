<template>
    <div class="role-screen">
        <!-- CỘT TRÁI: DANH SÁCH VAI TRÒ -->
        <div class="flex flex-col role-panel">
            <div class="panel-header">
                <div class="role-title-row">
                    <h2 class="role-detail-title">{{ $t("i18nSystem.RoleList.Title") }}</h2>
                </div>
            </div>

            <div class="role-list flex-1">
                <div class="role-list-nav">
                    <BaseButton class="w-full" size="md" variant="dash-normal" @click="addRole">
                        {{ $t("i18nSystem.RoleList.AddNew") }}
                    </BaseButton>
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
                                <p v-if="role.Description" class="role-desc">{{ role.Description }}</p>
                            </div>
                            <div
                                @click.stop="deleteRole(role as SysMscRole)"
                                class="icon-row-delete scale-[0.9]"
                                v-if="!role.IsSystem"
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
                    >
                        {{ $t("i18nSystem.RoleList.Edit") }}
                    </BaseButton>
                </div>
            </div>

            <div class="search-container flex justify-between">
                <BaseSwitch
                    :disabled="isDisableForm"
                    size="sm"
                    :label="$t('i18nSystem.RoleList.AllPermission')"
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
                                :label="$t('i18nSystem.RoleList.GroupAllPermission')"
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
                                @change="(e: Event) => onPermissionChange(group as SysMscRolePermissionMapping, e)"
                            />
                        </div>
                    </div>
                </div>

                <div v-if="filteredPermissionMappings.length === 0" class="empty-state">
                    <p class="empty-title">{{ $t("i18nSystem.RoleList.EmptyPermission") }}</p>
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
        const isEditing = ref(false);

        const tableStore = useTableStore("role", {
            keyID: "RoleID",
            viewOrTableName: "sys_msc_role",
            tableLoadData: (payload) => loadDataRemoteTable(RoleAPI, payload),
            sorts: [
                {
                    property: "IsSystem",
                    desc: true,
                },
                {
                    property: "RoleName",
                    desc: false,
                },
            ],
        });

        /**
         * lvhung - 15.06.2026
         * Bật/tắt trạng thái edit.
         */
        const toggleEdit = () => {
            isEditing.value = !isEditing.value;
        };

        /**
         * lvhung - 15.06.2026
         * Tính toán trạng thái disable form dựa theo IsSystem và isEditing.
         */
        const isDisableForm = computed(() => {
            if (currentRole.value.IsSystem) return true;
            return !isEditing.value;
        });

        /**
         * lvhung - 15.06.2026
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
         * lvhung - 15.06.2026
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
         * lvhung - 15.06.2026
         * Merge object nguồn vào object khuôn mẫu.
         * Kết quả chỉ có các key của khuôn mẫu, giá trị ưu tiên lấy từ nguồn nếu có.
         * @param sourceObject - object nguồn (giá trị từ server)
         * @param templateObject - object khuôn mẫu (default)
         */
        const mergeWithDefault = (
            sourceObject: Record<string, boolean>,
            templateObject: Record<string, boolean>,
        ): Record<string, boolean> => {
            return Object.fromEntries(
                Object.keys(templateObject).map((key) => [
                    key,
                    key in sourceObject ? sourceObject[key]! : templateObject[key]!,
                ]),
            );
        };

        /**
         * lvhung - 15.06.2026
         * Kiểm tra currentRole hoặc detail mapping có thay đổi không.
         */
        const hasChange = (): boolean => {
            return currentRole.value.getChange() !== null || currentRole.value.getAllChange() !== null;
        };

        /**
         * lvhung - 15.06.2026
         * Xử lý mở form thêm vai trò mới, hỏi lưu nếu đang có thay đổi.
         */
        const addRole = async () => {
            if (hasChange()) {
                const options = {
                    title: t("i18nCommon.TitleChange"),
                    confirmButtonText: t("i18nCommon.Save"),
                    cancelButtonText: t("i18nCommon.CancelNotSave"),
                };
                const confirmed = await showConfirm(t("i18nSystem.Confirm.SaveBeforeLeave"), options);
                if (confirmed && !(await saveRole())) return;
            }

            const newRole = buildNewRole();
            newRole.RoleName = t("i18nSystem.RoleList.DefaultRoleName");
            newRole.Description = t("i18nSystem.RoleList.DefaultRoleDesc");
            newRole.IsSystem = false;
            newRole.ModelState = ModelState.Insert;

            rolesList.value.push(newRole);
            currentRole.value = newRole;
            isEditing.value = true;
        };

        /**
         * lvhung - 15.06.2026
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
         * lvhung - 15.06.2026
         * Tải danh sách vai trò từ server.
         */
        const loadRolesAsync = async () => {
            await tableStore.loadData();
            rolesList.value = tableStore.data as unknown as SysMscRole[];
        };

        /**
         * lvhung - 15.06.2026
         * Chọn vai trò và tải chi tiết từ server.
         * skipCheck = true để bỏ qua kiểm tra thay đổi (dùng khi init hoặc sau delete).
         */
        const selectRole = async (role: SysMscRole, skipCheck = false) => {
            if (role.RoleID == currentRole.value.RoleID) return;

            if (!skipCheck && hasChange()) {
                const options = {
                    title: t("i18nCommon.TitleChange"),
                    confirmButtonText: t("i18nCommon.Save"),
                    cancelButtonText: t("i18nCommon.CancelNotSave"),
                };
                const confirmed = await showConfirm(t("i18nSystem.Confirm.SaveBeforeLeave"), options);
                if (confirmed && !(await saveRole())) return;
            }

            if (currentRole.value.ModelState === ModelState.Insert) {
                rolesList.value = rolesList.value.filter((role) => role.RoleID !== currentRole.value.RoleID);
            }

            isEditing.value = false;

            const res = await RoleAPI.getMasterDetail<SysMscRole>(role.RoleID);
            if (!res.Success || !res.Data) return;

            currentRole.value = new SysMscRole(res.Data);
            currentRole.value.SysMscRolePermissionMapping = buildPermissionMappings(
                currentRole.value.RoleID,
                res.Data.SysMscRolePermissionMapping,
            );
            currentRole.value.commitChange();
        };

        /**
         * lvhung - 15.06.2026
         * Lưu currentRole lên server.
         * @returns true nếu lưu thành công, false nếu không.
         */
        const saveRole = async (): Promise<boolean> => {
            if (!validateRole()) return false;

            currentRole.value.SysMscRolePermissionMapping.forEach((item) => {
                item.ListPermission = JSON.stringify(item.ListPermissionObject);
            });

            const saveData = currentRole.value.getSaveData();
            const saveResult = await RoleAPI.saveData(saveData);

            if (saveResult && saveResult.Success) {
                currentRole.value.commitChange();
                isEditing.value = false;
                return true;
            }

            return false;
        };

        /**
         * lvhung - 15.06.2026
         * Validate currentRole trước khi lưu.
         * @returns true nếu hợp lệ, false nếu không.
         */
        const validateRole = (): boolean => {
            const validateResult = currentRole.value.validate();
            if (!validateResult.isValid) {
                showWarning(validateResult.errors);
                return false;
            }
            return true;
        };

        /**
         * lvhung - 15.06.2026
         * Hủy chỉnh sửa, hỏi lưu nếu có thay đổi, rollback nếu không lưu.
         */
        const cancelRole = async () => {
            if (hasChange()) {
                const confirmed = await showConfirm(t("i18nSystem.Confirm.SaveBeforeLeave"));
                if (confirmed && !(await saveRole())) return;

                if (currentRole.value.ModelState === ModelState.Insert) {
                    rolesList.value = rolesList.value.filter((role) => role.RoleID !== currentRole.value.RoleID);
                    if (rolesList.value.length > 0) {
                        await selectRole(rolesList.value[0]! as SysMscRole, true);
                    }
                } else {
                    currentRole.value.rollbackChange();
                }
            }

            isEditing.value = false;
        };

        /**
         * lvhung - 15.06.2026
         * Xử lý xóa vai trò hiện tại, hỏi xác nhận trước khi xóa.
         */
        const deleteRole = async (role: SysMscRole) => {
            const confirmed = await showConfirm(t("i18nSystem.Confirm.DeleteRole", [role.RoleName]));

            if (!confirmed) return;

            const removeRoleFromList = async () => {
                rolesList.value = rolesList.value.filter((item) => item.RoleID !== role.RoleID);

                if (rolesList.value.length > 0) {
                    await selectRole(rolesList.value[0] as SysMscRole, true);
                }

                isEditing.value = false;
            };

            if (role.ModelState === ModelState.Insert) {
                await removeRoleFromList();
                return;
            }

            const deleteResult = await RoleAPI.saveData({
                ModelState: ModelState.Delete,
                RoleID: role.RoleID,
            });

            if (!deleteResult?.Success) return;

            await removeRoleFromList();
        };

        /**
         * lvhung - 15.06.2026
         * Cập nhật từ khóa tìm kiếm permission có debounce 300ms.
         */
        const onPermissionSearch = debounce((value: string) => {
            permissionSearchKeyword.value = value.trim().toLowerCase();
        }, 300);

        /**
         * lvhung - 15.06.2026
         * Kiểm tra toàn bộ permission đã được check chưa.
         */
        const isAllPermissionChecked = computed(() => {
            const mappingList = currentRole.value.SysMscRolePermissionMapping ?? [];
            if (mappingList.length === 0) return false;
            return mappingList.every((group) =>
                Object.values(group.ListPermissionObject ?? {}).every((val) => val === true),
            );
        });

        /**
         * lvhung - 15.06.2026
         * Check/uncheck toàn bộ permission trên tất cả group.
         */
        const onToggleAllPermission = (checked: boolean) => {
            (currentRole.value.SysMscRolePermissionMapping ?? []).forEach((group) => {
                Object.keys(group.ListPermissionObject ?? {}).forEach((key) => {
                    group.ListPermissionObject[key] = checked;
                });
                group.ListPermission = JSON.stringify(group.ListPermissionObject);
            });
        };

        /**
         * lvhung - 15.06.2026
         * Kiểm tra toàn bộ permission trong 1 group đã được check chưa.
         */
        const isGroupAllChecked = (group: Pick<SysMscRolePermissionMapping, "ListPermissionObject">) => {
            return Object.values(group.ListPermissionObject ?? {}).every((val) => val === true);
        };

        /**
         * lvhung - 15.06.2026
         * Check/uncheck toàn bộ permission trong 1 group.
         */
        const onToggleGroupPermission = (
            group: Pick<SysMscRolePermissionMapping, "ListPermissionObject" | "ListPermission">,
            checked: boolean,
        ) => {
            Object.keys(group.ListPermissionObject ?? {}).forEach((key) => {
                group.ListPermissionObject[key] = checked;
            });
            group.ListPermission = JSON.stringify(group.ListPermissionObject);
        };

        /**
         * lvhung - 15.06.2026
         * Xử lý sync lại ListPermission string khi checkbox permission thay đổi.
         */
        const onPermissionChange = (group: SysMscRolePermissionMapping, _e: Event) => {
            group.ListPermission = JSON.stringify(group.ListPermissionObject);
        };

        const roleSearchKeyword = ref("");

        /**
         * lvhung - 15.06.2026
         * Danh sách vai trò đã lọc theo từ khóa và sắp xếp theo IsSystem, RoleName.
         */
        const filteredRolesList = computed(() => {
            const keyword = roleSearchKeyword.value;

            const filtered = keyword
                ? rolesList.value.filter(
                      (role) =>
                          role.RoleName?.toLowerCase().includes(keyword) ||
                          role.Description?.toLowerCase().includes(keyword),
                  )
                : rolesList.value;

            return filtered;
        });

        /**
         * lvhung - 15.06.2026
         * Cập nhật từ khóa tìm kiếm vai trò có debounce 300ms.
         */
        const onRoleSearch = debounce((value: string) => {
            roleSearchKeyword.value = value.trim().toLowerCase();
        }, 300);

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
            onPermissionChange,
        };
    },
});
</script>

<style lang="scss" scoped>
@import "@/pages/system/RoleList.scss";
</style>
