import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import type { MenuItem, MenuGroupType } from "@/constants";
import { MenuGroup } from "@/constants";

const route = useRoute();

/**
 * Composable quản lý state và logic của Sidebar
 * @returns {Object} Sidebar state và methods
 */
export function useSidebar() {
    const router = useRouter();

    // ===== State =====
    const isCollapsed = ref(false);
    const activeKey = ref("dashboard");
    const menuGroups = ref<MenuGroupType[]>(MenuGroup);

    // ===== Computed =====
    /**
     * Lấy menu item hiện tại đang active
     */
    const currentMenuItem = computed((): MenuItem | null => {
        for (const group of menuGroups.value) {
            const item = group.items.find((item) => item.key === activeKey.value);
            if (item) return item;
        }
        return null;
    });

    /**
     * Kiểm tra có collapse hay không
     */
    const collapsed = computed(() => isCollapsed.value);

    // ===== Methods =====
    /**
     * Toggle trạng thái collapse/expand
     */
    const toggleCollapse = () => {
        isCollapsed.value = !isCollapsed.value;
        // Optional: Lưu vào localStorage để persistent
        localStorage.setItem("sidebar-collapsed", String(isCollapsed.value));
    };

    /**
     * Set menu item active
     * @param key - Key của menu item
     */
    const setActive = (key: string) => {
        activeKey.value = key;

        // Tìm route và navigate nếu có
        const menuItem = findMenuItemByKey(key);
        if (menuItem?.routeName) {
            router.push({ name: menuItem.routeName });
        }
    };

    /**
     * Collapse sidebar
     */
    const collapse = () => {
        isCollapsed.value = true;
        localStorage.setItem("sidebar-collapsed", "true");
    };

    /**
     * Expand sidebar
     */
    const expand = () => {
        isCollapsed.value = false;
        localStorage.setItem("sidebar-collapsed", "false");
    };

    /**
     * Tìm menu item theo key
     * @param key - Key của menu item
     */
    const findMenuItemByKey = (key: string): MenuItem | null => {
        for (const group of menuGroups.value) {
            const item = group.items.find((item) => item.key === key);
            if (item) return item;
        }
        return null;
    };

    /**
     * Set active theo route path
     * @param path - Route path
     */
    const setActiveByRoute = () => {
        const currentPath = router.currentRoute.value.path;
        for (const group of menuGroups.value) {
            const item = group.items.find((i) => {
                if (!i.routeName) return false;
                try {
                    const resolved = router.resolve({ name: i.routeName });
                    return currentPath === resolved.path || currentPath.startsWith(resolved.path + "/");
                } catch {
                    return false;
                }
            });
            if (item) {
                activeKey.value = item.key;
                return;
            }
        }
    };

    /**
     * Khôi phục trạng thái từ localStorage
     */
    const restoreState = () => {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        if (savedCollapsed !== null) {
            isCollapsed.value = savedCollapsed === "true";
        }

        // Set active theo current route
        setActiveByRoute();
    };

    // Khôi phục state khi init
    restoreState();

    return {
        // State
        isCollapsed,
        activeKey,
        menuGroups,

        // Computed
        currentMenuItem,
        collapsed,

        // Methods
        toggleCollapse,
        setActive,
        collapse,
        expand,
        findMenuItemByKey,
        setActiveByRoute,
        restoreState,
    };
}
