export const API_CONFIG = {
    AUTH: import.meta.env.VITE_AUTH_SERVICE,
    PRODUCT: import.meta.env.VITE_PRODUCT_SERVICE,
} as const;

export type ApiService = keyof typeof API_CONFIG;