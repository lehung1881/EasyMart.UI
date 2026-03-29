<template>
    <div class="app-sidebar" :class="{ collapsed: isCollapsed }">
        <!-- Logo / Brand -->
        <div class="sidebar-logo">
            <!-- <span class="logo-icon">⬡</span> -->
            <transition name="fade">
                <span v-if="!isCollapsed" class="logo-text">BizSuite</span>
            </transition>
        </div>

        <!-- Menu Groups -->
        <nav class="sidebar-nav">
            <template v-for="group in menuGroups" :key="group.label">
                <div class="menu-group">
                    <transition name="fade">
                        <p v-if="!isCollapsed" class="menu-group-label">{{ group.label }}</p>
                    </transition>
                    <ul>
                        <li
                            v-for="item in group.items"
                            :key="item.key"
                            class="menu-item"
                            :class="{ active: activeKey === item.key }"
                            @click="setActive(item.key)"
                        >
                            <div :class="['menu-icon', `icon-${item.key}`]" />
                            <transition name="fade">
                                <span v-if="!isCollapsed" class="menu-label">{{ item.label }}</span>
                            </transition>
                            <span v-if="item.badge && !isCollapsed" class="menu-badge" :class="item.badgeType">{{
                                item.badge
                            }}</span>
                        </li>
                    </ul>
                </div>
            </template>
        </nav>

        <!-- Collapse Toggle -->
        <div class="sidebar-footer" @click="toggleCollapse">
            <span class="collapse-icon icon-collapse" :class="{ rotated: isCollapsed }" />
            <transition name="fade">
                <span v-if="!isCollapsed" class="collapse-label">Thu gọn</span>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useSidebar } from "@/composables/layout/useSidebar";

// Sử dụng composable
const { isCollapsed, activeKey, menuGroups, toggleCollapse, setActive } = useSidebar();
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;
// @use "@/assets/styles/icons" as *;

.app-sidebar {
    width: $sidebar-width;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 12px 8px;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #fff;
    border-radius: 2px;
    border-right: 1px solid #f0f0f0;
    transition: width 0.25s ease;

    &.collapsed {
        width: 56px;

        .menu-group-label {
            display: none;
        }

        .menu-item {
            justify-content: center;
            padding: 10px 0;
        }
    }
}

.sidebar-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px 16px;
    border-bottom: 1px solid #f5f5f5;
    margin-bottom: 8px;

    .logo-icon {
        font-size: 22px;
        color: $primary-color;
        flex-shrink: 0;
    }

    .logo-text {
        font-size: 16px;
        font-weight: 700;
        color: $primary-color;
        white-space: nowrap;
    }
}

.sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.menu-group {
    margin-bottom: 4px;

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
}

.menu-group-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #b0b0b0;
    padding: 10px 10px 4px;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s ease;
    color: #555;
    position: relative;
    white-space: nowrap;

    &:hover {
        background-color: rgba($primary-color, 0.07);
        color: $primary-color;
        .menu-icon {
            background-color: $primary-color;
        }
    }

    &.active {
        background-color: rgba($primary-color, 0.1);
        color: $primary-color;
        font-weight: 600;

        .menu-icon {
            background-color: $primary-color;
        }

        &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 60%;
            background-color: $primary-color;
            border-radius: 0 3px 3px 0;
        }
    }
}

.menu-icon {
    flex-shrink: 0;
    transition: background-color 0.15s ease;
    cursor: pointer;
}

.menu-label {
    font-size: $font-size-base;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1.4;
    flex-shrink: 0;

    &.new {
        background-color: #e53935;
        color: #fff;
    }
    &.hot {
        background-color: #ff7043;
        color: #fff;
    }
}

.sidebar-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 10px;
    margin-top: 8px;
    border-top: 1px solid #f0f0f0;
    cursor: pointer;
    border-radius: 8px;
    color: #888;
    font-size: 13px;
    transition:
        background 0.15s ease,
        color 0.15s ease;

    &:hover {
        background-color: rgba($primary-color, 0.06);
        color: $primary-color;

        .collapse-icon {
            background-color: $primary-color;
        }
    }

    .collapse-label {
        white-space: nowrap;
    }
}

.collapse-icon {
    flex-shrink: 0;
    background-color: #888;
    transition:
        transform 0.25s ease,
        background-color 0.15s ease;
    cursor: pointer;

    &.rotated {
        transform: rotate(180deg);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
