declare global {
    interface Window {
        _detail?: any;
        _list?: any;
    }
}

/**
 * Gắn object debug detail vào `window._detail` để inspect nhanh.
 * @param payload Dữ liệu debug detail muốn expose ra window.
 * @returns Không trả về dữ liệu.
 */
export function attachDetailDebug(payload: any): void {
    window._detail = payload;
}

/**
 * Gỡ object debug khỏi `window._detail` nếu đúng instance hiện tại.
 * @param instance Instance detail dùng để xác thực khi gỡ.
 * @returns Không trả về dữ liệu.
 */
export function detachDetailDebug(): void {
    window._detail = undefined;
}

/**
 * Gắn object debug list vào `window._list` để inspect nhanh.
 * @param payload Dữ liệu debug list muốn expose ra window.
 * @returns Không trả về dữ liệu.
 */
export function attachListDebug(payload: any): void {
    window._list = payload;
}

/**
 * Gỡ object debug khỏi `window._list` nếu đúng instance hiện tại.
 * @param instance Instance list dùng để xác thực khi gỡ.
 * @returns Không trả về dữ liệu.
 */
export function detachListDebug(): void {
    window._list = undefined;
}
