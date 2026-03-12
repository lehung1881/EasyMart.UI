/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AUTH_SERVICE: string;
    readonly VITE_PRODUCT_SERVICE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}