import type { ColumnDefinition } from "@/models/common/columnDefinition";
import i18n from "@/i18n";
const { t } = i18n.global;

export const userColumns: ColumnDefinition[] = [
    {
        dataField: "FullName",
        title: t("i18nSystem.User.FullName"),
        width: 250,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "MobilePhone",
        title: t("i18nSystem.User.PhoneNumber"),
        width: 180,
        align: "left",
        visible: true,
    },
    {
        dataField: "Gender",
        title: t("i18nSystem.User.Gender"),
        width: 150,
        align: "left",
        visible: true,
    },
    {
        dataField: "RoleName",
        title: t("i18nSystem.User.Role"),
        width: 334,
        align: "left",
        visible: true,
    },
    {
        dataField: "Status",
        title: t("i18nCommon.Status"),
        width: 200,
        align: "left",
        visible: true,
    },
];
