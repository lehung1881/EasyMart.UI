import type { ColumnDefinition } from "@/models/common/columnDefinition";
import i18n from "@/i18n";
const { t } = i18n.global;

export const unitColumns: ColumnDefinition[] = [
    {
        dataField: "UnitName",
        title: t("i18nUnit.List.UnitName"),
        width: 200,
        align: "left",
        visible: true,
        sortOrder: 1,
    },
    {
        dataField: "Description",
        title: t("i18nCommon.Description"),
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
