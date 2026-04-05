import { useModal } from "vue-final-modal";
import type { Component } from "vue";

interface DialogOptions {
    [key: string]: any;
}

interface ModalInstance {
    open: () => Promise<any>;
    close: () => Promise<any>;
    patchOptions: (options: any) => void;
    destroy: () => void;
}

// Store để quản lý các modal instances
const modalInstances = new Map<string | Symbol, ModalInstance>();

export const usePopup = () => {
    /**
     * Hiển thị modal/dialog.
     * @param componentOrName Vue component hoặc tên component đã đăng ký global.
     * @param options Options truyền vào component.
     * @returns Modal instance với các method để control.
     */
    const show = (componentOrName: Component | string, options: DialogOptions = {}) => {
        if (!componentOrName) {
            throw new Error("Component không được để trống!");
        }

        // Chuyển hết vào thành params để truyền vào component qua props
        const optionParams = {
            params: options,
        };

        const { open, close, patchOptions, destroy } = useModal({
            component: componentOrName as Component,
            attrs: {
                ...optionParams,
                name: componentOrName as string,
                onClosed() {
                    // Cleanup khi modal đóng
                    options.onClosed?.();
                    destroy();
                },
            },
            slots: options.slots,
        });

        // Tự động mở modal
        open();

        const instance = { open, close, patchOptions, destroy };

        // Lưu instance nếu có name/id
        if (options.name) {
            modalInstances.set(options.name, instance);
        }

        return instance;
    };

    /**
     * Đóng modal theo name.
     * @param name Tên hoặc ID của modal.
     * @returns Không trả về dữ liệu.
     */
    const hide = (name: string | Symbol): void => {
        const instance = modalInstances.get(name);
        if (instance) {
            instance.close();
            modalInstances.delete(name);
        }
    };

    /**
     * Đóng tất cả modal đang mở.
     * @returns Không trả về dữ liệu.
     */
    const hideAll = (): void => {
        modalInstances.forEach((instance) => {
            instance.close();
        });
        modalInstances.clear();
    };

    /**
     * Kiểm tra modal có đang mở không.
     * @param name Tên hoặc ID của modal.
     * @returns `true` nếu modal đang mở, ngược lại `false`.
     */
    const isOpen = (name: string | Symbol): boolean => {
        return modalInstances.has(name);
    };

    /**
     * Lấy instance của modal theo name.
     * @param name Tên hoặc ID của modal.
     * @returns Modal instance nếu có, ngược lại `undefined`.
     */
    const getInstance = (name: string | Symbol): ModalInstance | undefined => {
        return modalInstances.get(name);
    };

    return {
        show,
        hide,
        hideAll,
        isOpen,
        getInstance,
    };
};
