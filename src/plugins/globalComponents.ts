import type { App, Plugin } from "vue";
import BaseButton from "@/components/controls/BaseButton.vue";
import BaseInput from "@/components/controls/BaseInput.vue";
import BaseDatepicker from "@/components/controls/BaseDatepicker.vue";
import BaseInputNumber from "@/components/controls/BaseInputNumber.vue";
import BaseTextArea from "@/components/controls/BaseTextArea.vue";
import BaseCheckbox from "@/components/controls/BaseCheckbox.vue";
import BaseRadio from "@/components/controls/BaseRadio.vue";
import BaseRadioGroup from "@/components/controls/BaseRadioGroup.vue";
import BaseCombobox from "@/components/controls/BaseCombobox.vue";
import BaseTable from "@/components/controls/BaseTable.vue";

const globalComponentsPlugin: Plugin = {
    /**
     * Registers shared base components globally for the app.
     * @param app Vue app instance used for component registration.
     * @returns No return value.
     */
    install(app: App) {
        app.mixin({
            mounted() {
                const me = this;
                if (me.$el && !me.$el.getVueInstance) {
                    me.$el.getVueInstance = function () {
                        return me;
                    };
                }
            },
        });
        app.component("BaseButton", BaseButton);
        app.component("BaseInput", BaseInput);
        app.component("BaseDatepicker", BaseDatepicker);
        app.component("BaseInputNumber", BaseInputNumber);
        app.component("BaseTextArea", BaseTextArea);
        app.component("BaseCheckbox", BaseCheckbox);
        app.component("BaseRadio", BaseRadio);
        app.component("BaseRadioGroup", BaseRadioGroup);
        app.component("BaseCombobox", BaseCombobox);
        app.component("BaseTable", BaseTable);
    },
};

export default globalComponentsPlugin;
