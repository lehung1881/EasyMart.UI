<template>
    <div 
        v-for="pos in positions" 
        :key="pos" 
        :class="['toast-container', `position-${pos}`]"
    >
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
                <button class="toast-close-btn" @click="removeToast(toast.id)">
                    <i class="icon-close"></i>
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { toastState, type ToastType, type ToastPosition } from "./toastState";

export default defineComponent({
    name: "BaseToastMessage",

    setup() {
        const positions: ToastPosition[] = [
            "top-right", "top-left", "top-center",
            "bottom-right", "bottom-left", "bottom-center"
        ];

        const getToastsByPosition = (pos: ToastPosition) => {
            return toastState.items.filter((item) => item.position === pos);
        };

        const removeToast = (id: number) => {
            const index = toastState.items.findIndex((item) => item.id === id);
            if (index !== -1) {
                const targetToast = toastState.items[index];
                if (typeof targetToast.beforeClose === "function") {
                    targetToast.beforeClose(id);
                }
                toastState.items.splice(index, 1);
            }
        };

        const getIconClass = (type: ToastType): string => {
            switch (type) {
                case "info": return "icon-info";
                case "warning": return "icon-warning";
                case "error": return "icon-error";
                case "success": return "icon-success";
                default: return "icon-info";
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
.position-top-right      { top: 0; right: 0; }
.position-top-left       { top: 0; left: 0; }
.position-top-center     { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }
.position-bottom-right   { bottom: 0; right: 0; display: flex; flex-direction: column-reverse; }
.position-bottom-left    { bottom: 0; left: 0; display: flex; flex-direction: column-reverse; }
.position-bottom-center  { bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; display: flex; flex-direction: column-reverse; }

.toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 340px;
    max-width: 500px;
    padding: 14px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: #ffffff;
    font-weight: 500;
}

// Màu sắc các trạng thái theo thiết kế
.toast-info { background-color: #1570EF; }
.toast-warning { background-color: #F79009; }
.toast-error { background-color: #F04438; }
.toast-success { background-color: #12B76A; }
.toast-custom { background-color: #344054; }

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
}

.toast-icon {
    font-size: 20px;
    display: flex;
    align-items: center;
    align-self: flex-start;
    margin-top: 2px;
}

.toast-text {
    font-size: 14px;
    line-height: 20px;
    flex: 1;
}

.toast-close-btn {
    background: none;
    border: none;
    color: #ffffff;
    cursor: pointer;
    opacity: 0.7;
    padding: 4px;
    display: flex;
    align-items: center;
    align-self: flex-start;
    margin-left: 8px;
    transition: opacity 0.2s;
    &:hover { opacity: 1; }
}

// --- Hiệu ứng chuyển động (Animations) ---
.toast-fade-right-enter-active, .toast-fade-right-leave-active { transition: all 0.25s ease; }
.toast-fade-right-enter-from { opacity: 0; transform: translateX(60px); }
.toast-fade-right-leave-to { opacity: 0; transform: translateY(-15px); }

.toast-fade-left-enter-active, .toast-fade-left-leave-active { transition: all 0.25s ease; }
.toast-fade-left-enter-from { opacity: 0; transform: translateX(-60px); }
.toast-fade-left-leave-to { opacity: 0; transform: translateY(-15px); }

.toast-fade-center-enter-active, .toast-fade-center-leave-active { transition: all 0.25s ease; }
.toast-fade-center-enter-from { opacity: 0; transform: scale(0.85) translateY(-20px); }
.toast-fade-center-leave-to { opacity: 0; transform: scale(0.85) translateY(-10px); }
</style>