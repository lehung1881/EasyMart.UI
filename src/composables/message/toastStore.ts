import { defineStore } from "pinia";
import { ref, type VNode, type Component } from "vue";

export type ToastType = "info" | "warning" | "error" | "success" | "custom";
export type ToastPosition = "top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center";

export interface ToastItem {
    id: number;
    message: string | VNode | Component;
    type: ToastType;
    position: ToastPosition;
    beforeClose?: (id: number) => void;
}

export const useToastStore = defineStore("toast", () => {
    // State lưu danh sách toast
    const items = ref<ToastItem[]>([]);

    /**
     * Action: Thêm một toast mới vào danh sách
     */
    const addToast = (toast: ToastItem) => {
        items.value.push(toast);
    };

    /**
     * Action: Xóa toast theo ID (Có kích hoạt callback trước khi đóng)
     */
    const removeToast = (id: number) => {
        const index = items.value.findIndex((item) => item.id === id);
        if (index !== -1) {
            const targetToast = items.value[index];
            if (typeof targetToast.beforeClose === "function") {
                targetToast.beforeClose(id);
            }
            items.value.splice(index, 1);
        }
    };

    /**
     * Action chiến lược: Giả lập gọi API lấy thông báo hệ thống khi người dùng vào ứng dụng
     * Bạn có thể gọi hàm này ở App.vue hoặc router sau khi user login thành công
     */
    const fetchAndShowSystemNotifications = async () => {
        try {
            // Giả lập call API (Thay bằng axios/fetch thực tế của bạn)
            // const res = await notificationAPI.getUnread();
            const mockApiResponse = [
                { id: 101, content: "Chào mừng bạn quay trở lại! Hệ thống vừa cập nhật tính năng mới.", type: "success" },
                { id: 102, content: "Lưu ý: Tài khoản của bạn sẽ hết hạn VIP sau 3 ngày nữa.", type: "warning" }
            ];

            // Duyệt qua kết quả từ API và nạp vào danh sách Toast để show lên màn hình
            mockApiResponse.forEach((noti) => {
                addToast({
                    id: Date.now() + noti.id,
                    message: noti.content,
                    type: noti.type as ToastType,
                    position: "top-right", // Vị trí mong muốn xuất hiện khi vào ứng dụng
                });
            });
        } catch (error) {
            console.error("Không thể lấy thông báo hệ thống:", error);
        }
    };

    return {
        items,
        addToast,
        removeToast,
        fetchAndShowSystemNotifications
    };
});