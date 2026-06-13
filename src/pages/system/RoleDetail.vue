<template>
    <div class="flex flex-col flex-1 detail-panel">
        <!-- Header chi tiết -->
        <div class="panel-header">
            <div v-if="isEditingInfo">
                <BaseInput type="text" v-model="roleName" placeholder="Tên nhóm quyền..." />
                <BaseInput type="text" v-model="roleDesc" placeholder="Mô tả..." />
            </div>
            <div v-else>
                <div class="role-title-row">
                    <h2 class="role-detail-title">{{ currentRole?.RoleName }}</h2>
                    <!-- <div @click="isEditingInfo = true" class="btn-edit-info">Thay đổi thông tin</div> -->
                </div>
                <!-- <p class="role-detail-desc">{{ currentRole?.Description }}</p> -->
            </div>
        </div>

        <!-- Thanh tìm kiếm bộ lọc quyền -->
        <div class="search-container">
            <BaseInput type="text" v-model="permissionSearch" placeholder="Tìm kiếm" class="!w-[250px]" />
        </div>

        <!-- BẢNG PHÂN QUYỀN CHẢY DÒNG - CONFIG THEO FILE MscSubSystem.ts -->
        <div class="permissions-container flex-1">
            <div v-for="group in filteredSubSystems" :key="group.SubSystemCode" class="group-card">
                <!-- Header Phân hệ -->
                <div class="group-header">
                    <div class="group-title-info">
                        <div class="group-title-row">
                            <h4 class="group-title">
                                {{ $t(`i18nSystem.${group.SubSystemCode}.Title`) }}
                            </h4>
                        </div>
                        <!-- <p class="group-subtitle">{{ $t(`i18nSystem.${group.SubSystemCode}.Description`) }}</p> -->
                    </div>
                </div>

                <!-- Danh sách Checkbox quyền hạn con trong phân hệ -->
                <div class="permission-rows grid grid-cols-12">
                    <div v-for="(val, action) in group.ListPermission" :key="action" class="col-span-3">
                        <BaseCheckbox
                            size="sm"
                            v-model="group.ListPermission[action]"
                            :label="$t(`i18nSystem.${group.SubSystemCode}.${action}`)"
                        />
                    </div>
                </div>
            </div>

            <!-- Lớp trống nếu tìm kiếm không có kết quả -->
            <div v-if="filteredSubSystems.length === 0" class="empty-state">
                <p class="empty-title">Không tìm thấy quyền hạn nào phù hợp từ khóa</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, onMounted } from "vue";
import { defaultSubSystem, MscSubSystem } from "@/pages/system/MscSubSystem";

interface RoleData {
    RoleID: string;
    RoleName: string;
    Description: string;
    IsSystem: boolean;
    ListPermission: Record<string, Record<string, boolean>>;
}

export default defineComponent({
    name: "RoleDetail",

    props: {
        currentRole: {
            type: Object as PropType<RoleData>,
            required: true,
        },
    },

    setup(props, { emit }) {
        /**
         * Constant data
         */
        const mscSubSystems = ref(defaultSubSystem);

        const currentValue = ref({});

        /**
         * State
         */
        const editedPermissions = ref<Record<string, Record<string, boolean>>>({});

        const roleName = ref("");
        const roleDesc = ref("");
        const isEditingInfo = ref(false);
        const permissionSearch = ref("");

        onMounted(() => {
            currentValue.value = mappingDefaultRole();
        });

        const mappingDefaultRole = () => {
            currentValue.value = props.currentRole;
        };

        /**
         * Kiểm tra có thay đổi chưa lưu
         */
        const hasUnsavedChanges = computed(() => {
            if (!props.currentRole) return false;

            return (
                JSON.stringify(editedPermissions.value) !== JSON.stringify(props.currentRole.ListPermission) ||
                roleName.value !== props.currentRole.RoleName ||
                roleDesc.value !== props.currentRole.Description
            );
        });

        /**
         * Danh sách phân hệ sau khi filter
         */
        const filteredSubSystems = computed<MscSubSystem[]>(() => {
            const keyword = permissionSearch.value.trim().toLowerCase();

            return mscSubSystems.value;
        });

        return {
            mscSubSystems,
            editedPermissions,
            roleName,
            roleDesc,
            isEditingInfo,
            permissionSearch,
            hasUnsavedChanges,
            filteredSubSystems,
        };
    },
});
</script>

<style lang="scss" scoped>
@import "@/pages/system/RoleList.scss";
.detail-panel {
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
}

.search-container {
    padding: 0 16px 16px 16px;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    gap: 8px;
}

.permissions-container {
    overflow-y: auto;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background-color: rgba(248, 250, 252, 0.2);
    .group-card {
        background-color: #ffffff;
        border-radius: 8px;
        border: 1px solid #e0e0e0;
        .group-header {
            padding: 12px;
            background-color: #fafafa;
            border-radius: 8px 8px 0 0;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .group-title {
            font-weight: 600;
            font-size: 13px;
            color: #1e293b;
            letter-spacing: 0.05em;
        }

        .group-subtitle {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
        }

        .permission-rows {
            // display: flex;
            // flex-direction: column;
            background-color: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            padding: 12px;
            row-gap: 12px;
            &:last-child {
                border-bottom: none;
            }
            border-radius: 0 0 8px 8px;
        }
    }
}

.group-title-info {
    flex: 1;
}

.group-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
}
.empty-state {
    text-align: center;
    padding: 48px 0;
    background-color: #ffffff;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
}

.empty-title {
    color: #475569;
    font-size: 12px;
    margin-top: 12px;
    font-weight: 500;
}
</style>
