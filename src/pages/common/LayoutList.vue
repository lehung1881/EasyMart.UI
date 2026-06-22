<template>
    <div class="list-page">
        <div class="page-header">
            <slot name="page-header"></slot>
        </div>

        <div class="page-content">
            <slot name="page-content"></slot>
        </div>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;
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
        padding: 0 16px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        border-radius: 8px;
    }
}
</style>
