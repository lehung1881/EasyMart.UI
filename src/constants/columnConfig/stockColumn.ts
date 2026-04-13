import type { ColumnDefinition } from "@/models/common/columnDefinition";

import i18n from "@/i18n";
const { t } = i18n.global;

export const stockColumns: ColumnDefinition[] = [
    {
        dataField: "StockCode",
        title: t("i18nStock.List.StockCode"),
        width: 150,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "StockName",
        title: t("i18nStock.List.StockName"),
        width: 250,
        align: "left",
        visible: true,
        sortOrder: 2,
    },
    {
        dataField: "Address",
        title: t("i18nStock.List.Address"),
        width: 300,
        align: "left",
        visible: true,
    },
    {
        dataField: "Description",
        title: t("i18nCommon.Description"),
        // width: 200,
        align: "left",
        visible: true,
    },
    {
        dataField: "Status",
        title: t("i18nCommon.Status"),
        width: 150,
        align: "center",
        visible: true,
    },
];
