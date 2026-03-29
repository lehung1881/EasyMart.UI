import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./routers";
import { i18nPlugin } from "./i18n";
import globalComponentsPlugin from "@/plugins/globalComponents";
import "./style.css";
import "@/assets/styles/_variable.scss";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18nPlugin);
app.use(globalComponentsPlugin);

app.mount("#app");
