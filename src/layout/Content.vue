<template>
    <div class="app-content">
        <slot />
    </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;
.app-content {
    height: 100%;
    padding: 0 12px;
    flex: 1;
    overflow: hidden;
}
</style>
