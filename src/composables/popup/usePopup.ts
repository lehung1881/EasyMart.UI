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

export function useDialog() {
    /**
     * Hiển thị modal/dialog.
     * @param componentOrName Vue component hoặc tên component đã đăng ký global.
     * @param options Options truyền vào component.
     * @returns Modal instance với các method để control.
     */
    function show(componentOrName: Component | string, options: DialogOptions = {}) {
        if (!componentOrName) {
            throw new Error("Component không được để trống!");
        }

        const { open, close, patchOptions, destroy } = useModal({
            component: componentOrName as Component,
            attrs: {
                ...options,
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
    }

    /**
     * Đóng modal theo name.
     * @param name Tên hoặc ID của modal.
     * @returns Không trả về dữ liệu.
     */
    function hide(name: string | Symbol): void {
        const instance = modalInstances.get(name);
        if (instance) {
            instance.close();
            modalInstances.delete(name);
        }
    }

    /**
     * Đóng tất cả modal đang mở.
     * @returns Không trả về dữ liệu.
     */
    function hideAll(): void {
        modalInstances.forEach((instance) => {
            instance.close();
        });
        modalInstances.clear();
    }

    /**
     * Kiểm tra modal có đang mở không.
     * @param name Tên hoặc ID của modal.
     * @returns `true` nếu modal đang mở, ngược lại `false`.
     */
    function isOpen(name: string | Symbol): boolean {
        return modalInstances.has(name);
    }

    /**
     * Lấy instance của modal theo name.
     * @param name Tên hoặc ID của modal.
     * @returns Modal instance nếu có, ngược lại `undefined`.
     */
    function getInstance(name: string | Symbol): ModalInstance | undefined {
        return modalInstances.get(name);
    }

    return {
        show,
        hide,
        hideAll,
        isOpen,
        getInstance,
    };
}
