import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./routers";
import { i18nPlugin } from "./i18n";
import globalComponentsPlugin from "@/plugins/global-components";
import "@/assets/styles/_base.scss";
import "./style.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18nPlugin);
app.use(globalComponentsPlugin);

app.mount("#app");
