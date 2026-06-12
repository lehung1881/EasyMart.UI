<template>
    <span
        class="status-tag"
        :style="tagStyle"
    >
        <span
            class="status-dot"
            :style="{ backgroundColor: currentStyle.dotColor }"
        />
        {{ currentStatus?.text ?? defaultText }}
    </span>
</template>

<script setup lang="ts">
import { computed, CSSProperties } from 'vue';

export type StatusMapType =
    | 'None'
    | 'Processing'
    | 'Success'
    | 'Warning'
    | 'Error'
    | 'Accent';

export interface StatusItem {
    value: number | string;
    text: string;
    statusMap?: StatusMapType;
}

interface Props {
    status: number | string | null | undefined;
    listStatus: StatusItem[];
    defaultText?: string;
}

const props = withDefaults(defineProps<Props>(), {
    defaultText: '-',
});

const styleMappingDefault = {
    None: {
        color: '#717680',
        bgColor: '#F5F5F5',
        borderColor: '#D5D7DA',
        dotColor: '#A4A7AE',
    },
    Processing: {
        color: '#1570EF',
        bgColor: '#EFF8FF',
        borderColor: '#B2DDFF',
        dotColor: '#1570EF',
    },
    Success: {
        color: '#12B76A',
        bgColor: '#ECFDF3',
        borderColor: '#A6F4C5',
        dotColor: '#12B76A',
    },
    Warning: {
        color: '#F79009',
        bgColor: '#FFFAEB',
        borderColor: '#FEDF89',
        dotColor: '#F79009',
    },
    Error: {
        color: '#F04438',
        bgColor: '#FEF3F2',
        borderColor: '#FECDCA',
        dotColor: '#F04438',
    },
    Accent: {
        color: '#9E77ED',
        bgColor: '#F9F5FF',
        borderColor: '#E9D7FE',
        dotColor: '#9E77ED',
    },
};

const currentStatus = computed(() =>
    props.listStatus.find(
        item => item.value === props.status,
    ),
);

const currentStyle = computed(() => {
    const mapKey = currentStatus.value?.statusMap ?? 'None';

    return (
        styleMappingDefault[mapKey] ??
        styleMappingDefault.None
    );
});

const tagStyle = computed<CSSProperties>(() => ({
    color: currentStyle.value.color,
    backgroundColor: currentStyle.value.bgColor,
    border: `1px solid ${currentStyle.value.borderColor}`,
}));
</script>

<style scoped>
.status-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    min-height: 24px;
    padding: 0 10px;

    border-radius: 9999px;

    font-size: 12px;
    font-weight: 500;
    line-height: 20px;

    white-space: nowrap;
    box-sizing: border-box;
}

.status-dot {
    width: 8px;
    height: 8px;

    border-radius: 50%;
    flex-shrink: 0;
}
</style>