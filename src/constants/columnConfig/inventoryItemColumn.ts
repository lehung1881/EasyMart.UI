import type { ColumnDefinition } from "@/models/common/columnDefinition";
import { FormatType } from "@/constants/enumration/formatType.ts";

import i18n from "@/i18n";
const { t } = i18n.global;

export const inventoryItemColumns: ColumnDefinition[] = [
    {
        dataField: "InventoryItemCode",
        title: t("i18nInventoryItem.List.InventoryItemCode"),
        width: 140,
        align: "left",
        visible: true,
    },
    {
        dataField: "InventoryItemName",
        title: t("i18nInventoryItem.List.InventoryItemName"),
        align: "left",
        visible: true,
    },
    {
        dataField: "InventoryItemCategoryNameList",
        title: t("i18nInventoryItem.List.InventoryItemCategory"),
        width: 180,
        align: "left",
        visible: true,
    },
    {
        dataField: "UnitName",
        title: t("i18nInventoryItem.List.Unit"),
        width: 120,
        align: "left",
        visible: true,
    },
    {
        dataField: "BuyPrice",
        title: t("i18nInventoryItem.List.BuyPrice"),
        width: 140,
        align: "right",
        visible: true,
        formatType: FormatType.Currency,
    },
    {
        dataField: "SellPrice",
        title: t("i18nInventoryItem.List.SellPrice"),
        width: 140,
        align: "right",
        visible: true,
        formatType: FormatType.Currency,
    },
    {
        dataField: "QuantityBalance",
        title: t("i18nInventoryItem.List.QuantityBalance"),
        width: 110,
        align: "right",
        visible: true,
        formatType: FormatType.Quantity,
    },
    {
        dataField: "MinimumStock",
        title: t("i18nInventoryItem.List.MinimumStock"),
        width: 120,
        align: "right",
        visible: true,
        formatType: FormatType.Quantity,
    },
    {
        dataField: "Status",
        title: t("i18nCommon.Status"),
        width: 150,
        align: "left",
        visible: true,
    },
];
