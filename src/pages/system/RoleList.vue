<template>
    <div class="role-screen">
        <!-- CỘT TRÁI: DANH SÁCH VAI TRÒ -->
        <div class="flex flex-col role-panel">
            <div class="panel-header">
                <div class="role-title-row">
                    <h2 class="role-detail-title">Vai trò</h2>
                    <!-- <p @click="isCreating = true" class="btn-edit-info">Thêm vai trò</p> -->
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
                    ></BaseTextArea>
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
                                <!-- <span v-if="role.IsSystem" class="badge-system"> Mặc định </span> -->
                            </div>
                            <p class="role-desc">{{ role.Description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <RoleDetail v-if="currentRole" :current-role="currentRole" @save-changes="handleSaveDetailChanges" />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";

import { defaultSubSystem, MscSubSystem } from "@/pages/system/MscSubSystem";
import RoleDetail from "./RoleDetail.vue";

interface RoleData {
    RoleID: string;
    RoleName: string;
    Description: string;
    IsSystem: boolean;
    ListPermission: any;
}

export default defineComponent({
    name: "RoleList",
    components: {
        RoleDetail,
    },
    setup() {
        /**
         * Danh sách vai trò hiển thị
         */
        const rolesList = ref<RoleData[]>([]);

        /**
         * Vai trò đang được chọn
         */
        const currentRole = ref<RoleData | null>(null);

        /**
         * Trạng thái tạo mới
         */
        const isCreating = ref(false);

        /**
         * Form tạo mới
         */
        const newRoleName = ref("");
        const newRoleDesc = ref("");

        onMounted(() => {
            rolesList.value = [];

            if (rolesList.value.length > 0) {
                currentRole.value = rolesList.value[0];
            }
        });

        const mappingDefaultRole = () => {
            lstFakeRoles.forEach((item) => {
                if (item.ListPermission) {
                    defaultSubSystem;
                }
            });
        };

        const selectRole = (role: RoleData) => {
            currentRole.value = role;
        };

        /**
         * Lưu thay đổi từ màn hình chi tiết
         */
        const handleSaveDetailChanges = (updatedDetails: {
            RoleID: string;
            RoleName: string;
            Description: string;
            ListPermission: Record<string, Record<string, boolean>>;
        }) => {
            const idx = rolesList.value.findIndex((role) => role.RoleID === updatedDetails.RoleID);

            if (idx === -1) {
                return;
            }

            const role = rolesList.value[idx];

            role.RoleName = updatedDetails.RoleName;

            role.name = updatedDetails.RoleName;

            role.Description = updatedDetails.Description;

            role.description = updatedDetails.Description;

            role.ListPermission = updatedDetails.ListPermission;
        };

        return {
            rolesList,
            isCreating,
            newRoleName,
            newRoleDesc,
            currentRole,
            selectRole,
            handleSaveDetailChanges,
        };
    },
});
</script>

<style lang="scss" scoped>
@import "@/pages/system/RoleList.scss";
.role-screen {
    display: flex;
    height: 100%;
    gap: 12px;
    // padding-left: 16px;
}
.role-panel {
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    width: 250px;
    // border-right: 1px solid #e0e0e0;
}

.panel-title {
    font-weight: 600;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.icon-shield {
    width: 16px;
    height: 16px;
    color: #475569;
}

.panel-subtitle {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
}
.icon-plus {
    width: 14px;
    height: 14px;
    color: #475569;
}

.create-role-form {
    padding: 16px;
    // border-bottom: 1px solid #e2e8f0;
    // background-color: rgba(238, 242, 255, 0.3);
}

.form-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 4px;
}

.role-list {
    overflow-y: auto;
    // max-height: 500px;
    display: flex;
    flex-direction: column;

    @media (min-width: 1280px) {
        max-height: 600px;
    }
}

.role-item {
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;

    &:hover {
        background-color: rgba(248, 250, 252, 0.4);
    }

    &.active {
        background-color: rgba(238, 242, 255, 0.4);
        box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, 0.02);
    }

    &:last-child {
        border-bottom: none;
    }
}

.role-item-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.role-item-left {
    flex: 1;
    min-width: 0;
}

.role-title-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
}

.role-name {
    font-weight: 600;
    font-size: 13px;
    color: #334155;

    &.active {
        color: #312e81;
    }
}

.badge-system {
    font-size: 9px;
    font-weight: 700;
    background-color: #f1f5f9;
    color: #64748b;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.role-desc {
    font-size: 11.5px;
    color: #64748b;
    margin-top: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
