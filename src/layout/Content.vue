<template>
    <main class="app-content">
        <slot />
    </main>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-content {
    margin-top: 48px;
    margin-left: 240px;
    min-height: calc(100vh - 48px);
    padding: 16px;
    background: #f8fafc;
}
</style>
