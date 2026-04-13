import type { ColumnDefinition } from "@/models/common/columnDefinition";
import i18n from "@/i18n";
const { t } = i18n.global;

export const supplierColumns: ColumnDefinition[] = [
    {
        dataField: "SupplierCode",
        title: t("i18nSupplier.List.SupplierCode"),
        width: 160,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "SupplierName",
        title: t("i18nSupplier.List.SupplierName"),
        width: 260,
        align: "left",
        visible: true,
        sortOrder: 2,
    },
    {
        dataField: "PhoneNumber",
        title: t("i18nSupplier.List.PhoneNumber"),
        width: 150,
        align: "left",
        visible: true,
    },
    { dataField: "Email", title: t("i18nSupplier.List.Email"), width: 220, align: "left", visible: true },
    { dataField: "Address", title: t("i18nSupplier.List.Address"), align: "left", visible: true },
    {
        dataField: "SupplierType",
        title: t("i18nSupplier.List.SupplierType"),
        width: 140,
        align: "center",
        visible: true,
    },
    { dataField: "Status", title: t("i18nCommon.Status"), width: 150, align: "center", visible: true },
];
