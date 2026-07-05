import { ref, onBeforeUnmount } from "vue";

const MIN_SIDEBAR_WIDTH = 380;
const MAX_SIDEBAR_WIDTH = 600;
const CACHE_KEY = "saorder_pos_sidebar_width";

/**
 * lvhung - 05.07.2026
 * Quản lý toàn bộ logic kéo giãn sidebar theo trục X.
 * Tự động cache chiều rộng vào localStorage và restore khi mount lại.
 */
export const useOrderSidebarResize = () => {
    // #region STATE
    const cachedWidth = Number(localStorage.getItem(CACHE_KEY)) || MIN_SIDEBAR_WIDTH;

    const sidebarWidth = ref(cachedWidth);
    const isResizing = ref(false);
    const resizeStartX = ref(0);
    const resizeStartWidth = ref(cachedWidth);
    // #endregion

    // #region HELPERS
    /**
     * lvhung - 05.07.2026
     * Đảm bảo chiều rộng sidebar luôn nằm trong khoảng [MIN, MAX] cho phép.
     * @param width Chiều rộng dự định thiết lập.
     */
    const clampSidebarWidth = (width: number): number => {
        return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
    };
    // #endregion

    // #region ACTIONS
    /**
     * lvhung - 05.07.2026
     * Kết thúc tiến trình resize và gỡ bỏ event listener khỏi window.
     * Khai báo trước executeSidebarResize vì được tham chiếu bên trong.
     */
    const terminateSidebarResize = (): void => {
        isResizing.value = false;
        window.removeEventListener("mousemove", executeSidebarResize);
        window.removeEventListener("mouseup", terminateSidebarResize);
    };

    /**
     * lvhung - 05.07.2026
     * Tính toán và cập nhật chiều rộng sidebar theo tọa độ chuột di chuyển trên trục X.
     * Đồng thời lưu giá trị mới vào localStorage.
     * @param event Sự kiện MouseEvent từ window mousemove.
     */
    const executeSidebarResize = (event: MouseEvent): void => {
        if (!isResizing.value) return;
        const nextWidth = clampSidebarWidth(resizeStartWidth.value - (event.clientX - resizeStartX.value));
        sidebarWidth.value = nextWidth;
        localStorage.setItem(CACHE_KEY, String(nextWidth));
    };

    /**
     * lvhung - 05.07.2026
     * Kích hoạt tiến trình resize khi người dùng nhấn giữ chuột vào thanh phân tách.
     * @param event Sự kiện MouseEvent từ mousedown trên resize handle.
     */
    const initiateSidebarResize = (event: MouseEvent): void => {
        event.preventDefault();
        isResizing.value = true;
        resizeStartX.value = event.clientX;
        resizeStartWidth.value = sidebarWidth.value;
        window.addEventListener("mousemove", executeSidebarResize);
        window.addEventListener("mouseup", terminateSidebarResize);
    };
    // #endregion

    // #region LIFECYCLE
    onBeforeUnmount(() => {
        terminateSidebarResize();
    });
    // #endregion

    return {
        sidebarWidth,
        initiateSidebarResize,
    };
};
