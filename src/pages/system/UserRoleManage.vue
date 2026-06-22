<template>
    <div class="list-page">
        <div class="page-header">
            <div class="page-title">
                <div class="page-title-line"></div>
                <h1 class="page-title-text">Người dùng & vai trò</h1>
            </div>

            <div class="page-tabs">
                <div
                    v-for="tab in tabsConfig"
                    :key="tab.routeName"
                    class="tab-item"
                    :class="{ active: currentRouteName === tab.routeName }"
                    @click="changeTab(tab.routeName)"
                >
                    <span class="tab-text" :data-text="tab.label">{{ tab.label }}</span>
                </div>
            </div>
        </div>

        <div class="page-content">
            <RouterView></RouterView>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import LayoutList from "@/pages/common/LayoutList.vue";

export default defineComponent({
    name: "CustomerList",
    components: { LayoutList },
    setup() {
        const { proxy } = getCurrentInstance() as any;
        const router = useRouter();
        const route = useRoute();

        // 1. Định nghĩa mảng cấu hình các tab rõ ràng
        const tabsConfig = [
            { label: "Người dùng", routeName: "UserList" },
            { label: "Vai trò", routeName: "RoleList" },
        ];

        // Lấy tên route hiện tại để active tab tương ứng một cách tự động
        const currentRouteName = computed(() => route.name);

        // Hàm xử lý việc chuyển trang khi click vào tab
        const changeTab = (routeName: string) => {
            // Chỉ push route nếu click vào tab khác tab hiện tại
            if (currentRouteName.value !== routeName) {
                router.push({ name: routeName });
            }
        };

        return {
            tabsConfig,
            currentRouteName,
            changeTab,
        };
    },
});
</script>

<style lang="scss" scoped>
.list-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 12px;
    height: 100%;
    min-height: 0;

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        background: #ffffff;
        border-radius: 8px;
    }

    .page-content {
        background: #ffffff;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        border-radius: 8px;
    }
}

.page-title {
    display: flex;
    align-items: center;
    gap: 8px;
    .page-title-line {
        background-color: $primary-color;
        width: 8px;
        height: 20px;
        border-radius: 8px;
    }
    .page-title-text {
        margin: 0;
        font-size: 18px;
        color: $color-text-black;
        font-weight: 700;
    }
}

/* CSS cho phần Tabs */
.page-tabs {
    display: flex;
    gap: 4px;
    background: rgba(81, 64, 234, 0.1);
    padding: 4px;
    border-radius: 6px;

    .tab-item {
        padding: 4px 14px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 4px;
        user-select: none;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        &:hover {
            color: $primary-color;
        }

        &.active {
            background: #ffffff;
            color: $primary-color;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            font-weight: 500;
        }
    }
}
</style>
