<template>
    <VueFinalModal
        v-slot="{ close }"
        v-bind="$attrs"
        :class="['flex items-center', isRight ? 'justify-end' : 'justify-center']"
        content-class="modal-content"
        :content-style="contentStyles"
        :esc-to-close="true"
        :drag-selector="dragable ? '.modal-title' : undefined"
        :click-to-close="false"
        :drag="dragable"
        overlay-transition="vfm-fade"
        content-transition="vfm-slide-right"
    >
        <div class="popup-content relative">
            <button
                v-if="showIconClose"
                type="button"
                class="icon-close absolute w-9 h-9 right-4 top-4 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Đóng"
                @click="close"
            >
                <div class="icon-close-24" />
            </button>

            <div v-if="title" class="modal-header modal-title flex items-center text-2xl font-bold" :class="{ 'cursor-move': dragable }">
                {{ title }}
            </div>
            <div v-else class="modal-header" :class="{ 'cursor-move': dragable }">
                <slot name="header" />
            </div>

            <div class="modal-body">
                <slot name="content" :close="close" />
            </div>

            <div class="modal-footer">
                <slot name="footer" :close="close" />
            </div>
        </div>
    </VueFinalModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VueFinalModal } from "vue-final-modal";

interface Props {
    /** Hiển thị modal ở bên phải màn hình */
    isRight?: boolean;
    /** Cho phép kéo modal */
    dragable?: boolean;
    /** Chiều rộng tùy chỉnh */
    width?: string;
    /** Chiều cao tùy chỉnh */
    height?: string;
    /** Tiêu đề modal */
    title?: string;
    /** Hiển thị nút đóng */
    showIconClose?: boolean;
    /** Modal toàn màn hình */
    fullSize?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    isRight: false,
    dragable: false,
    showIconClose: true,
    fullSize: false,
});

const contentStyles = computed(() => {
    const style: Record<string, string> = {};

    if (props.fullSize) {
        style.width = "100vw";
        style.height = "100vh";
        return style;
    }

    if (props.isRight) {
        style.height = "100vh";
    }

    if (props.width) {
        style.width = props.width;
    }

    if (props.height) {
        style.height = props.height;
    }

    return style;
});
</script>

<style scoped lang="scss">
.popup-content {
    height: 100%;
    width: 100%;
    background: white;
    border-radius: 4px;
}

.modal-header,
.modal-body,
.modal-footer {
    padding: 16px;
}

.modal-title {
    min-height: 64px;
    padding-right: 56px;
}

.icon-close {
    &:hover {
        background-color: #eff1f6;
    }
}

:deep(.vfm-slide-right-enter-active),
:deep(.vfm-slide-right-leave-active) {
    transition: transform 0.3s ease;
}

:deep(.vfm-slide-right-enter-from) {
    transform: translateX(100%);
}

:deep(.vfm-slide-right-leave-to) {
    transform: translateX(100%);
}
</style>
