/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_AUTH_SERVICE: string;
    readonly VITE_DI_SERVICE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
