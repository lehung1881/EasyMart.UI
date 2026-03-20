import type { App, Plugin } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";

const globalComponentsPlugin: Plugin = {
    install(app: App) {
        app.component("BaseButton", BaseButton);
    },
};

export default globalComponentsPlugin;
