import type { RouteRecordRaw } from "vue-router";

const systemRoutes: RouteRecordRaw[] = [
    {
        path: "system/user-role-manage",
        name: "UserRoleManage",
        component: () => import("@/pages/system/UserRoleManage.vue"),
        redirect: { name: "UserList" },
        children: [
            {
                path: "user",
                name: "UserList",
                component: () => import("@/pages/system/UserList.vue"),
            },
            {
                path: "role",
                name: "RoleList",
                component: () => import("@/pages/system/RoleListDetail.vue"),
            },
        ],
    },
];

export default systemRoutes;
