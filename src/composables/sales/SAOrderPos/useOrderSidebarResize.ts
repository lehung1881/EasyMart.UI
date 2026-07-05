import { ref, onBeforeUnmount } from "vue";

const MIN_SIDEBAR_WIDTH = 380;
const MAX_SIDEBAR_WIDTH = 600;

/**
 * lvhung - 05.07.2026
 * Quản lý toàn bộ logic kéo giãn sidebar theo trục X:
 * theo dõi trạng thái resize, tính toán chiều rộng mới và dọn dẹp event listener.
 */
export function useSidebarResize() {
    // ── STATE ────────────────────────────────────────────────────────────

    const sidebarWidth = ref(MIN_SIDEBAR_WIDTH);
    const isResizing = ref(false);
    const resizeStartX = ref(0);
    const resizeStartWidth = ref(MIN_SIDEBAR_WIDTH);

    // ── HELPERS ──────────────────────────────────────────────────────────

    /**
     * lvhung - 05.07.2026
     * Đảm bảo chiều rộng sidebar luôn nằm trong khoảng [MIN, MAX] cho phép.
     * @param width Chiều rộng dự định thiết lập.
     */
    function clampSidebarWidth(width: number): number {
        return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
    }

    // ── ACTIONS ──────────────────────────────────────────────────────────

    /**
     * lvhung - 05.07.2026
     * Tính toán và cập nhật chiều rộng sidebar theo tọa độ chuột di chuyển trên trục X.
     * @param event Sự kiện MouseEvent từ window mousemove.
     */
    function executeSidebarResize(event: MouseEvent): void {
        if (!isResizing.value) return;
        const nextWidth = resizeStartWidth.value - (event.clientX - resizeStartX.value);
        sidebarWidth.value = clampSidebarWidth(nextWidth);
    }

    /**
     * lvhung - 05.07.2026
     * Kết thúc tiến trình resize sidebar và gỡ bỏ event listener khỏi window.
     */
    function terminateSidebarResize(): void {
        isResizing.value = false;
        window.removeEventListener("mousemove", executeSidebarResize);
        window.removeEventListener("mouseup", terminateSidebarResize);
    }

    /**
     * lvhung - 05.07.2026
     * Kích hoạt tiến trình resize khi người dùng nhấn giữ chuột vào thanh phân tách.
     * @param event Sự kiện MouseEvent từ mousedown trên resize handle.
     */
    function initiateSidebarResize(event: MouseEvent): void {
        event.preventDefault();
        isResizing.value = true;
        resizeStartX.value = event.clientX;
        resizeStartWidth.value = sidebarWidth.value;
        window.addEventListener("mousemove", executeSidebarResize);
        window.addEventListener("mouseup", terminateSidebarResize);
    }

    // ── LIFECYCLE ────────────────────────────────────────────────────────

    onBeforeUnmount(() => {
        terminateSidebarResize();
    });

    return {
        sidebarWidth,
        initiateSidebarResize,
    };
}
