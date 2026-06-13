export const API_CONFIG = {
    AUTH: import.meta.env.VITE_AUTH_SERVICE,
    BUSINESS: import.meta.env.VITE_BUSINESS_SERVICE,
} as const;

export type ApiService = keyof typeof API_CONFIG;
