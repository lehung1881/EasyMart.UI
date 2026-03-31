<template>
    <Teleport to="body">
        <Transition name="msgbox-fade">
            <div class="msgbox-overlay" @click.self="handleOverlayClick">
                <Transition name="msgbox-zoom">
                    <div class="msgbox-container" @keydown="handleEsc" tabindex="0">
                        <div class="msgbox-content">
                            <h3 v-if="title" class="msgbox-title">{{ title }}</h3>
                            <p class="msgbox-message">{{ message }}</p>
                        </div>

                        <div class="msgbox-actions justify-end">
                            <BaseButton v-if="showCancelButton" @click="handleCancel(() => $close(this, false))">
                                {{ cancelButtonText }}
                            </BaseButton>

                            <BaseButton @click="handleConfirm(() => $close(this, true))" variant="primary">
                                {{ confirmButtonText }}
                            </BaseButton>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { MessageBoxType } from "@/commons/messageBox";

// Props
defineProps({
    type: {
        type: String as () => MessageBoxType,
        default: "info",
    },
    title: {
        type: String,
        default: "",
    },
    message: {
        type: String,
        required: true,
    },
    showCancelButton: {
        type: Boolean,
        default: true,
    },
    confirmButtonText: {
        type: String,
        default: "Xác nhận",
    },
    cancelButtonText: {
        type: String,
        default: "Hủy",
    },
    closeOnClickOverlay: {
        type: Boolean,
        default: false,
    },
});

// state
const result = ref<boolean>(false);

// handlers nhận callback
const handleConfirm = (cb: () => void) => {
    result.value = true;
    cb();
};

const handleCancel = (cb: () => void) => {
    result.value = false;
    cb();
};

const handleOverlayClick = () => {
    // overlay sẽ tự gọi cancel logic
};

const handleEsc = (e: KeyboardEvent) => {
    e.preventDefault();
};
</script>

<style scoped>
.msgbox-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
}

.msgbox-container {
    background: white;
    border-radius: 6px;
    padding: 16px;
    max-width: 420px;
    width: 100%;
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.msgbox-title {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
}

.msgbox-message {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.6;
}

.msgbox-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

/* Transitions */
.msgbox-fade-enter-active,
.msgbox-fade-leave-active {
    transition: opacity 0.2s;
}

.msgbox-fade-enter-from,
.msgbox-fade-leave-to {
    opacity: 0;
}

.msgbox-zoom-enter-active,
.msgbox-zoom-leave-active {
    transition: all 0.2s;
}

.msgbox-zoom-enter-from,
.msgbox-zoom-leave-to {
    opacity: 0;
    transform: scale(0.9);
}
</style>
