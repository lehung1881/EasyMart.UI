<template>
    <div class="main-layout">
        <Header />
        <div class="main-layout_content">
            <Sidebar />
            <Content>
                <RouterView />
            </Content>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import Header from "@/layout/Header.vue";
import Sidebar from "@/layout/Sidebar.vue";
import Content from "@/layout/Content.vue";
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;
.main-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    .main-layout_content {
        height: calc(100% - $header-height);
        max-height: calc(100% - $header-height);
        display: flex;
        background-color: rgba($primary-color, 0.1);
        padding: 12px 12px 0;
        gap: 12px;
    }
}
</style>
