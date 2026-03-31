import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./routers";
import { i18nPlugin } from "./i18n";
import globalComponentsPlugin from "@/plugins/globalComponents";
import "./style.css";
import { PromiseDialog } from "vue3-promise-dialog";
const app = createApp(App);
// setupPromiseDialog(app);
app.use(PromiseDialog);
app.use(createPinia());
app.use(router);
app.use(i18nPlugin);
app.use(globalComponentsPlugin);

app.mount("#app");
