import type { App, Plugin } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseCheckbox from "@/components/base/BaseCheckbox.vue";

const globalComponentsPlugin: Plugin = {
    install(app: App) {
        app.component("BaseButton", BaseButton);
        app.component("BaseInput", BaseInput);
        app.component("BaseCheckbox", BaseCheckbox);
    },
};

export default globalComponentsPlugin;
