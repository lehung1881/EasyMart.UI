<template>
    <aside class="app-sidebar">
        <nav class="sidebar-nav">
            <a class="nav-item" href="#">Dashboard</a>
            <a class="nav-item" href="#">Dictionary</a>
            <a class="nav-item" href="#">Sales</a>
        </nav>
    </aside>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-sidebar {
    position: fixed;
    top: 48px;
    left: 0;
    width: 240px;
    height: calc(100vh - 48px);
    background: #111827;
    border-right: 1px solid rgba(148, 163, 184, 0.2);
    padding: 12px;
    overflow-y: auto;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.nav-item {
    display: block;
    color: #e5e7eb;
    text-decoration: none;
    font-size: 13px;
    padding: 8px 10px;
    border-radius: 6px;
}

.nav-item:hover {
    background: rgba(148, 163, 184, 0.16);
}
</style>
