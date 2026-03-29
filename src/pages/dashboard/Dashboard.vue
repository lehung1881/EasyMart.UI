<template>
    <div class="dashboard-demo">
        <h1 class="dashboard-demo__title">BaseTable Demo</h1>

        <section class="dashboard-demo__section">
            <h2 class="dashboard-demo__heading">Local mode</h2>
            <p class="dashboard-demo__desc">Store dung du lieu tinh, phan trang theo page va so dong/trang.</p>

            <div class="dashboard-demo__toolbar">
                <input
                    v-model="localQuery"
                    class="dashboard-demo__input"
                    type="text"
                    placeholder="Search local table"
                    @input="onLocalSearch"
                />
            </div>

            <BaseTable
                label="Inventory Local"
                :store="localTableStore"
                row-key="InventoryItemID"
                @row-click="onLocalRowClick"
            />

            <pre class="dashboard-demo__preview">{{ JSON.stringify(localSelectedRow, null, 2) }}</pre>
        </section>

        <section class="dashboard-demo__section">
            <h2 class="dashboard-demo__heading">Remote mode</h2>
            <p class="dashboard-demo__desc">Store goi API paging thong qua callback tableLoadData.</p>

            <div class="dashboard-demo__toolbar">
                <button class="dashboard-demo__button" type="button" @click="reloadRemoteData">
                    Reload remote data
                </button>
            </div>

            <BaseTable
                label="Inventory Remote"
                :store="remoteTableStore"
                row-key="InventoryItemID"
                @row-click="onRemoteRowClick"
            />

            <pre class="dashboard-demo__preview">{{ JSON.stringify(remoteSelectedRow, null, 2) }}</pre>
        </section>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import BaseTable from "@/components/base/BaseTable.vue";
import { useTableStore, loadDataRemoteTable, type TableRow } from "@/composables/controls/useTableStore";
import type { ColumnDefinition } from "@/models/common/columnDefinition";
import authApi from "@/api/modules/authApi";

const localColumns: ColumnDefinition[] = [
    { dataField: "InventoryItemCode", title: "Mã hàng", width: 160 },
    { dataField: "InventoryItemName", title: "Tên hàng", width: 260 },
    { dataField: "BuyPrice", title: "Giá mua", width: 140, align: "right" },
    { dataField: "QuantityBalance", title: "Số lượng tồn kho", width: 140, align: "right" },
];

const remoteColumns: ColumnDefinition[] = [
    { dataField: "InventoryItemCode", title: "Mã hàng", width: 160 },
    { dataField: "InventoryItemName", title: "Tên hàng", width: 260 },
    { dataField: "BuyPrice", title: "Giá mua", width: 140, align: "right" },
    { dataField: "QuantityBalance", title: "Số lượng tồn kho", width: 140, align: "right" },
];

const localRows: TableRow[] = [
    {
        InventoryItemID: "ITM001",
        InventoryItemCode: "HH001",
        InventoryItemName: "Ban phim co",
        UnitName: "Cai",
        QuantityBalance: 42,
    },
    {
        InventoryItemID: "ITM002",
        InventoryItemCode: "HH002",
        InventoryItemName: "Chuot gaming",
        UnitName: "Cai",
        QuantityBalance: 28,
    },
    {
        InventoryItemID: "ITM003",
        InventoryItemCode: "HH003",
        InventoryItemName: "Man hinh 27 inch",
        UnitName: "Cai",
        QuantityBalance: 13,
    },
    {
        InventoryItemID: "ITM004",
        InventoryItemCode: "HH004",
        InventoryItemName: "Tai nghe khong day",
        UnitName: "Cai",
        QuantityBalance: 8,
    },
    {
        InventoryItemID: "ITM005",
        InventoryItemCode: "HH005",
        InventoryItemName: "Webcam full HD",
        UnitName: "Cai",
        QuantityBalance: 0,
    },
    {
        InventoryItemID: "ITM006",
        InventoryItemCode: "HH006",
        InventoryItemName: "Loa bluetooth",
        UnitName: "Cai",
        QuantityBalance: 21,
    },
    {
        InventoryItemID: "ITM007",
        InventoryItemCode: "HH007",
        InventoryItemName: "SSD NVMe 1TB",
        UnitName: "Cai",
        QuantityBalance: 15,
    },
];

export default defineComponent({
    name: "Dashboard",
    components: {
        BaseTable,
    },
    setup() {
        const localTableStore = useTableStore("dashboard_local_table", {
            queryMode: "local",
            data: localRows,
            columns: localColumns,
        });

        const remoteTableStore = useTableStore("dashboard_remote_table", {
            queryMode: "remote",
            tableLoadData: (payload) => loadDataRemoteTable(authApi, payload),
            viewOrTableName: "di_inventory_item",
            columns: remoteColumns,
        });

        const localQuery = ref<string>("");
        const localSelectedRow = ref<TableRow | null>(null);
        const remoteSelectedRow = ref<TableRow | null>(null);

        /**
         * Handle local table search query.
         * @returns Promise when reload completes.
         */
        const onLocalSearch = async (): Promise<void> => {
            await localTableStore.loadData(localQuery.value, 1);
        };

        /**
         * Handle local row click event.
         * @param payload Clicked row payload.
         * @returns No return value.
         */
        const onLocalRowClick = (payload: { row: TableRow; index: number }): void => {
            localSelectedRow.value = payload.row;
        };

        /**
         * Handle remote row click event.
         * @param payload Clicked row payload.
         * @returns No return value.
         */
        const onRemoteRowClick = (payload: { row: TableRow; index: number }): void => {
            remoteSelectedRow.value = payload.row;
        };

        /**
         * Reload remote table from first page.
         * @returns Promise when reload completes.
         */
        const reloadRemoteData = async (): Promise<void> => {
            await remoteTableStore.loadData("", 1);
        };

        /**
         * Initialize local data at mount time.
         * @returns Promise when initial load completes.
         */
        onMounted(async () => {
            await localTableStore.loadData("", 1);
        });

        return {
            localTableStore,
            remoteTableStore,
            localQuery,
            localSelectedRow,
            remoteSelectedRow,
            onLocalSearch,
            onLocalRowClick,
            onRemoteRowClick,
            reloadRemoteData,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variable" as *;

.dashboard-demo {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.dashboard-demo__title {
    margin: 0;
    color: $primary-color;
    font-size: 22px;
}

.dashboard-demo__section {
    background: #fff;
    border: 1px solid #e2e2e2;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.dashboard-demo__heading {
    margin: 0;
    font-size: 16px;
}

.dashboard-demo__desc {
    margin: 0;
    color: #6b7280;
}

.dashboard-demo__toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
}

.dashboard-demo__input {
    width: 280px;
    height: 34px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 10px;
}

.dashboard-demo__button {
    height: 34px;
    border: 1px solid $primary-color;
    color: $primary-color;
    background: #fff;
    border-radius: 6px;
    padding: 0 12px;
    cursor: pointer;
}

.dashboard-demo__preview {
    margin: 0;
    background: #111827;
    color: #c7f9cc;
    border-radius: 6px;
    padding: 12px;
    max-height: 200px;
    overflow: auto;
    font-size: 12px;
}
</style>
