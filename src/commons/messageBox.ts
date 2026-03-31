/**
 * messageBox.ts
 * API wrapper cho BaseMessageBox với vue3-promise-dialog
 */

import { openDialog } from "vue3-promise-dialog";
import BaseMessageBox from "@/components/messagebox/BaseMessageBox.vue";

export type MessageBoxType = "info" | "success" | "warning" | "error";

export interface MessageBoxOptions {
    type?: MessageBoxType;
    title?: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    closeOnClickOverlay?: boolean;
    showCancelButton?: boolean;
}

/**
 * showAlert - Thông báo đơn giản, chỉ có nút OK
 */
export const showAlert = async (message: string, options?: Partial<MessageBoxOptions>): Promise<void> => {
    return await openDialog(BaseMessageBox, {
        type: options?.type || "info",
        title: options?.title,
        message,
        showCancelButton: false,
        confirmButtonText: options?.confirmButtonText || "OK",
        closeOnClickOverlay: options?.closeOnClickOverlay ?? false,
    });
};

/**
 * showConfirm - Xác nhận hành động, có nút Hủy
 */
export const showConfirm = async (message: string, options?: Partial<MessageBoxOptions>): Promise<boolean> => {
    return await openDialog(BaseMessageBox, {
        type: options?.type || "warning",
        title: options?.title || "Xác nhận",
        message,
        showCancelButton: true,
        confirmButtonText: options?.confirmButtonText || "Xác nhận",
        cancelButtonText: options?.cancelButtonText || "Hủy",
        closeOnClickOverlay: options?.closeOnClickOverlay ?? false,
    });
};

/**
 * showSuccess - Thông báo thành công
 */
export const showSuccess = async (message: string, title?: string): Promise<void> => {
    await showAlert(message, { type: "success", title: title || "Thành công" });
};

/**
 * showError - Thông báo lỗi
 */
export const showError = async (message: string, title?: string): Promise<void> => {
    await showAlert(message, { type: "error", title: title || "Lỗi" });
};

/**
 * showWarning - Cảnh báo
 */
export const showWarning = async (message: string, title?: string): Promise<void> => {
    await showAlert(message, { type: "warning", title: title || "Cảnh báo" });
};

/**
 * showInfo - Thông tin
 */
export const showInfo = async (message: string, title?: string): Promise<void> => {
    await showAlert(message, { type: "info", title: title || "Thông tin" });
};

// Export MessageBox object
export const MessageBox = {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
};

export default MessageBox;
