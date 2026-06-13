import type { ColumnDefinition } from "@/models/common/columnDefinition";
import i18n from "@/i18n";
const { t } = i18n.global;

export const customerColumns: ColumnDefinition[] = [
    {
        dataField: "CustomerCode",
        title: t("i18nCustomer.List.CustomerCode"),
        width: 160,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "CustomerName",
        title: t("i18nCustomer.List.CustomerName"),
        width: 260,
        align: "left",
        visible: true,
        sortOrder: 2,
    },

    {
        dataField: "PhoneNumber",
        title: t("i18nCustomer.List.PhoneNumber"),
        width: 150,
        align: "left",
        visible: true,
    },
    { dataField: "Email", title: t("i18nCustomer.List.Email"), width: 220, align: "left", visible: true },
    { dataField: "Address", title: t("i18nCustomer.List.Address"), align: "left", visible: true },
    {
        dataField: "CustomerType",
        title: t("i18nCustomer.List.CustomerType"),
        width: 140,
        align: "left",
        visible: true,
    },
    { dataField: "Status", title: t("i18nCommon.Status"), width: 200, align: "center", visible: true },
];
