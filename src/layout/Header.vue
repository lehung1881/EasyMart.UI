<template>
    <header class="app-header">
        <div class="header-title">EasyMart</div>
    </header>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
    z-index: 1000;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: #0f172a;
    color: #f8fafc;
    border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}

.header-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.4px;
}
</style>
