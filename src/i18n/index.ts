import { createI18n } from "vue-i18n";
import type { App } from "vue";
import vi from "./i18n_vi";
import en from "./i18n_en";

/**
 * Cấu trúc thư mục i18n:
 *
 * src/i18n/
 * ├── index.ts              ← khởi tạo, export instance + setLocale helper
 * ├── i18n_vi.ts            ← merge tất cả modules (VI)
 * ├── i18n_en.ts            ← merge tất cả modules (EN)
 * └── modules/
 *     ├── vi/
 *     │   ├── i18nCommon.ts
 *     │   └── i18nAuth.ts
 *     └── en/
 *         ├── i18nCommon.ts
 *         └── i18nAuth.ts
 *
 * Thêm phân hệ mới (VD: product):
 *   1. Tạo modules/vi/i18nProduct.ts + modules/en/i18nProduct.ts
 *   2. Import và merge vào i18n_vi.ts + i18n_en.ts
 */

export type SupportedLocale = "vi" | "en";

const i18n = createI18n({
    legacy: false,
    locale: (localStorage.getItem("locale") as SupportedLocale) ?? "vi",
    fallbackLocale: "en",
    messages: { vi, en },
});

/**
 * Đổi ngôn ngữ toàn app, lưu localStorage và cập nhật lang attribute.
 *
 * @example
 * import { setLocale } from '@/i18n'
 * setLocale('en')
 */
export function setLocale(locale: SupportedLocale) {
    (i18n.global.locale as any).value = locale;
    localStorage.setItem("locale", locale);
    document.documentElement.setAttribute("lang", locale);
}

/**
 * Plugin cài i18n vào Vue app và đăng ký $t như global property
 * để dùng được qua proxy.$t trong Options API, class component, hoặc ngoài setup().
 *
 * @example — trong main.ts:
 *   import { createApp } from 'vue'
 *   import { i18nPlugin } from '@/i18n'
 *   createApp(App).use(i18nPlugin).mount('#app')
 *
 * @example — trong component (Composition API):
 *   const { t } = useI18n()
 *
 * @example — trong component (Options API / proxy):
 *   this.$t('common.processing')
 *
 * @example — ngoài component (store, service...):
 *   import { globalT } from '@/i18n'
 *   globalT('common.error')
 */
export const i18nPlugin = {
    install(app: App) {
        // 1. Cài vue-i18n vào app (cung cấp useI18n, <i18n-t>...)
        app.use(i18n);

        // 2. Đăng ký $t như global property để truy cập qua proxy.$t
        app.config.globalProperties.$t = i18n.global.t;
    },
};

/**
 * Hàm t() dùng ngoài component (Pinia store, axios interceptor, utils...).
 */
export const globalT = i18n.global.t;

export default i18n;
