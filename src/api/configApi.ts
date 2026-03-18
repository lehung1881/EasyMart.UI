export const API_CONFIG = {
    AUTH: import.meta.env.VITE_AUTH_SERVICE,
    DI: import.meta.env.VITE_DI_SERVICE,
} as const;

export type ApiService = keyof typeof API_CONFIG;
