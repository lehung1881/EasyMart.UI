<template>
    <div class="main-layout">
        <Header />
        <Sidebar />
        <Content>
            <RouterView />
        </Content>
    </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import Header from "@/layout/Header.vue";
import Sidebar from "@/layout/Sidebar.vue";
import Content from "@/layout/Content.vue";
</script>

<style scoped>
.main-layout {
    --header-height: 48px;
    --sidebar-width: 240px;
}
</style>
