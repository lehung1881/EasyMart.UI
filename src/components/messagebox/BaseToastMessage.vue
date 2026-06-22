<template>
    <Teleport to="body">
        <div v-for="pos in positions" :key="pos" :class="['toast-container', `position-${pos}`]">
            <TransitionGroup :name="getTransitionName(pos)">
                <div
                    v-for="toast in getToastsByPosition(pos)"
                    :key="toast.id"
                    class="toast-item"
                    :class="`toast-${toast.type}`"
                >
                    <div class="toast-content">
                        <i v-if="toast.type !== 'custom'" :class="getIconClass(toast.type)" class="toast-icon"></i>

                        <div class="toast-text">
                            <span v-if="typeof toast.message === 'string'">{{ toast.message }}</span>
                            <component v-else :is="toast.message" :toast-id="toast.id" />
                        </div>
                    </div>

                    <div
                        class="flex items-center justify-center w-[20px] h-[20px] cursor-pointer toast-close-wrapper"
                        @click="removeToast(toast.id)"
                    >
                        <div class="icon-close-small"></div>
                    </div>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useToastStore, type ToastType, type ToastPosition } from "@/composables/message/toastStore.ts";

export default defineComponent({
    name: "BaseToastMessage",

    setup() {
        const toastStore = useToastStore();

        const positions: ToastPosition[] = [
            "top-right",
            "top-left",
            "top-center",
            "bottom-right",
            "bottom-left",
            "bottom-center",
        ];

        const getToastsByPosition = (pos: ToastPosition) => {
            return toastStore.items.filter((item: any) => item.position === pos);
        };

        const removeToast = (id: number) => {
            toastStore.removeToast(id);
        };

        const getIconClass = (type: ToastType): string => {
            switch (type) {
                case "info":
                    return "icon-info";
                case "warning":
                    return "icon-warning";
                case "error":
                    return "icon-error";
                case "success":
                    return "icon-success";
                default:
                    return "icon-info";
            }
        };

        const getTransitionName = (pos: ToastPosition): string => {
            if (pos.includes("right")) return "toast-fade-right";
            if (pos.includes("left")) return "toast-fade-left";
            return "toast-fade-center";
        };

        return {
            positions,
            getToastsByPosition,
            removeToast,
            getIconClass,
            getTransitionName,
        };
    },
});
</script>

<style scoped lang="scss">
.toast-container {
    position: fixed;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
    padding: 24px;
}

// Định vị 6 vùng hiển thị trên màn hình
.position-top-right {
    top: 0;
    right: 0;
}
.position-top-left {
    top: 0;
    left: 0;
}
.position-top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
}
.position-bottom-right {
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column-reverse;
}
.position-bottom-left {
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column-reverse;
}
.position-bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
    display: flex;
    flex-direction: column-reverse;
}

// Cấu trúc khung Toast item - padding cập nhật theo file mới của bạn (8px 12px)
.toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 340px;
    max-width: 500px;
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); // Giảm bớt shadow để tiệp vào nền nhẹ
    box-sizing: border-box;
    font-weight: 500;
}

// 🎨 ĐỒNG BỘ HỆ MÀU SOFT-PASTEL + BORDER THEO ĐÚNG STYLE_VARIANTS CỦA STATUS TAG
.toast-info {
    color: #1570ef;
    background-color: #eff8ff;
    border: 1px solid #b2ddff;
    .toast-close-wrapper {
        color: #1570ef;
    }
}
.toast-warning {
    color: #f79009;
    background-color: #fffaeb;
    border: 1px solid #fedf89;
    .toast-close-wrapper {
        color: #f79009;
    }
}
.toast-error {
    color: #f04438;
    background-color: #fef3f2;
    border: 1px solid #fecdca;
    .toast-close-wrapper {
        color: #f04438;
    }
}
.toast-success {
    color: #12b76a;
    background-color: #ecfdf3;
    border: 1px solid #a6f4c5;
    .toast-close-wrapper {
        color: #12b76a;
    }
}
.toast-custom {
    color: #9e77ed;
    background-color: #f9f5ff;
    border: 1px solid #e9d7fe;
    .toast-close-wrapper {
        color: #9e77ed;
    }
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 10px; // Thu hẹp khoảng cách gap một chút cho cân đối với padding nhỏ 8px
    flex: 1;
}

.toast-icon {
    font-size: 18px;
    display: flex;
    align-items: center;
    align-self: flex-start;
    margin-top: 1px;
}

.toast-text {
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    flex: 1;
}

// Hiệu ứng tăng độ rõ nét cho cụm nút đóng khi hover
.toast-close-wrapper {
    opacity: 0.6;
    transition: opacity 0.2s ease;
    &:hover {
        opacity: 1;
    }
}

// --- Hiệu ứng chuyển động (Animations) ---
.toast-fade-right-enter-active,
.toast-fade-right-leave-active {
    transition: all 0.25s ease;
}
.toast-fade-right-enter-from {
    opacity: 0;
    transform: translateX(60px);
}
.toast-fade-right-leave-to {
    opacity: 0;
    transform: translateY(-15px);
}

.toast-fade-left-enter-active,
.toast-fade-left-leave-active {
    transition: all 0.25s ease;
}
.toast-fade-left-enter-from {
    opacity: 0;
    transform: translateX(-60px);
}
.toast-fade-left-leave-to {
    opacity: 0;
    transform: translateY(-15px);
}

.toast-fade-center-enter-active,
.toast-fade-center-leave-active {
    transition: all 0.25s ease;
}
.toast-fade-center-enter-from {
    opacity: 0;
    transform: scale(0.85) translateY(-20px);
}
.toast-fade-center-leave-to {
    opacity: 0;
    transform: scale(0.85) translateY(-10px);
}
</style>
