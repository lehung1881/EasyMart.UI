import type { RouteRecordRaw } from "vue-router";

const dictionaryRoutes: RouteRecordRaw[] = [
    {
        path: "dictionary",
        name: "Dictionary",
        component: () => import("@/pages/dictionary/Dictionary.vue"),
    },
];

export default dictionaryRoutes;
