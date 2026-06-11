<template>
    <span
        class="status-tag"
        :style="tagStyle"
    >
        {{ currentStatus?.text ?? defaultText }}
    </span>
</template>

<script setup lang="ts">
import { computed, CSSProperties } from 'vue';

export interface StatusItem {
    value: number | string;
    text: string;
    color?: string;
    background?: string;
}

interface Props {
    status: number | string | null | undefined;
    listStatus: StatusItem[];
    defaultText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    defaultText: '-',
});

const currentStatus = computed<StatusItem | undefined>(() => {
    return props.listStatus.find(
        item => item.value === props.status,
    );
});

const tagStyle = computed<CSSProperties>(() => ({
    color: currentStatus.value?.color ?? '#344054',
    backgroundColor: currentStatus.value?.background ?? '#F2F4F7',
}));
</script>

<style scoped>
.status-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-height: 24px;
    padding: 0 10px;

    border-radius: 12px;

    font-size: 12px;
    font-weight: 500;
    line-height: 24px;

    white-space: nowrap;
    box-sizing: border-box;
}
</style>