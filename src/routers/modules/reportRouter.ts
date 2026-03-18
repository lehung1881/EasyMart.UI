import type { RouteRecordRaw } from "vue-router";

const reportRoutes: RouteRecordRaw[] = [
    {
        path: "report",
        name: "Report",
        component: () => import("@/pages/report/Report.vue"),
    },
];

export default reportRoutes;
