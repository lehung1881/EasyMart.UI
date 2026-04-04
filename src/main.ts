import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./routers";
import { i18nPlugin } from "./i18n";
import globalComponentsPlugin from "@/plugins/globalComponents";
import globalPopup from "@/plugins/globalPopup";
import "./style.css";
import { PromiseDialog } from "vue3-promise-dialog";

import "vue-final-modal/style.css";
import { createVfm } from "vue-final-modal";
const vfm = createVfm();

const app = createApp(App);

// Modal
app.use(vfm);

// Dialog
app.use(PromiseDialog);

// Pinia, Router, i18n, Global Components
app.use(createPinia());
app.use(router);
app.use(i18nPlugin);
app.use(globalComponentsPlugin);
app.use(globalPopup);

app.mount("#app");
