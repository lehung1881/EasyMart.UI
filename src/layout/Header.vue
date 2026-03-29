<template>
    <header class="app-header"></header>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;
.app-header {
    height: $header-height;
    z-index: 1000;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: $header-color;
    color: #f8fafc;
    box-shadow: 0 1px 10px #0000000f;
}

.header-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.4px;
}
</style>
