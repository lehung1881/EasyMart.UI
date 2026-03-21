import type { App, Plugin } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseCheckbox from "@/components/base/BaseCheckbox.vue";
import BaseRadio from "@/components/base/BaseRadio.vue";
import BaseRadioGroup from "@/components/base/BaseRadioGroup.vue";

const globalComponentsPlugin: Plugin = {
    /**
     * Registers shared base components globally for the app.
     * @param app Vue app instance used for component registration.
     * @returns No return value.
     */
    install(app: App) {
        app.component("BaseButton", BaseButton);
        app.component("BaseInput", BaseInput);
        app.component("BaseCheckbox", BaseCheckbox);
        app.component("BaseRadio", BaseRadio);
        app.component("BaseRadioGroup", BaseRadioGroup);
    },
};

export default globalComponentsPlugin;
