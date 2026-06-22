import { type VNode, type Component } from "vue";
import { useToastStore, type ToastType, type ToastItem, type ToastPosition } from "./toastStore";

interface ToastOptions {
    duration?: number; // Thời gian hiển thị (ms), mặc định 3000ms
    autoClose?: boolean; // Tự động đóng hay giữ im? Mặc định là true
    position?: ToastPosition; // Vị trí hiển thị, mặc định 'top-right'
    beforeClose?: (id: number) => void; // Callback kích hoạt ngay trước khi đóng
}

export function useToastMessage() {
    // Khởi tạo thực thể Pinia Store để tương tác
    const store = useToastStore();

    /**
     * Hàm lõi đẩy thông báo vào hệ thống quản lý tập trung
     */
    const show = (message: string | VNode | Component, type: ToastType = "info", options: ToastOptions = {}) => {
        const id = Date.now() + Math.random();
        const position = options.position || "top-right";
        const autoClose = options.autoClose !== undefined ? options.autoClose : true;
        const duration = options.duration !== undefined ? options.duration : 3000;

        const newToast: ToastItem = {
            id,
            message,
            type,
            position,
            beforeClose: options.beforeClose,
        };

        // Bắn dữ liệu vào Pinia Store thông qua Action gộp chung
        store.addToast(newToast);

        // Chỉ tạo bộ đếm thời gian nếu autoClose thiết lập bằng true
        if (autoClose) {
            setTimeout(() => {
                // Gọi action xoá tập trung của Pinia
                store.removeToast(id);
            }, duration);
        }
    };

    // Các hàm Shortcut tiện ích
    const showInfo = (msg: string | VNode | Component, opts?: ToastOptions) => show(msg, "info", opts);
    const showWarning = (msg: string | VNode | Component, opts?: ToastOptions) => show(msg, "warning", opts);
    const showError = (msg: string | VNode | Component, opts?: ToastOptions) => show(msg, "error", opts);
    const showSuccess = (msg: string | VNode | Component, opts?: ToastOptions) => show(msg, "success", opts);
    const showCustom = (customContent: VNode | Component, opts?: ToastOptions) => show(customContent, "custom", opts);

    return {
        show,
        showInfo,
        showWarning,
        showError,
        showSuccess,
        showCustom,
        // Xuất thêm hàm fetch từ store ra ngoài để app cần dùng thì gọi luôn
        fetchAndShowSystemNotifications: store.fetchAndShowSystemNotifications,
    };
}
