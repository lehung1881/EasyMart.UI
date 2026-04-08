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
        @beforeOpen="beforeOpen"
    >
        <div class="popup-content relative" :class="{ 'is-right': isRight }">
            <div
                v-if="showIconClose"
                type="button"
                class="absolute w-[32px] h-[32px] right-4 top-4 flex items-center justify-center rounded-full hover:bg-[#eff1f6] transition-colors"
                aria-label="Đóng"
                @click="close"
            >
                <div class="icon-close-24" />
            </div>

            <div
                v-if="title"
                class="modal-header modal-title flex items-center text-xl font-bold"
                :class="{ 'cursor-move': dragable }"
            >
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

const emit = defineEmits<{
    /** Sự kiện được gọi trước khi mở popup */
    (e: "beforeOpen", params: any): void;
}>();

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

    /**
     * Dữ liệu tùy chỉnh truyền vào popup khi mở
     */
    params: any | undefined;
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

const beforeOpen = (e: any): void => {
    emit("beforeOpen", { e, params: props.params });
};
</script>

<style scoped lang="scss">
.popup-content {
    height: 100%;
    width: 100%;
    background: white;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    &.is-right {
        border-top-left-radius: 8px;
        border-bottom-left-radius: 8px;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
    }
}

.modal-header,
.modal-body {
    padding: 0 16px;
}

.modal-body {
    flex: 1;
}
.modal-footer {
    padding: 16px;
}

.modal-title {
    min-height: 56px;
    padding-right: 56px;
}

.icon-close {
    &:hover {
        background-color: #eff1f6;
    }
}
</style>
