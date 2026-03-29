<template>
    <div class="demo">
        <!-- ── Header ─────────────────────────────────────────────────────────── -->
        <div class="demo__header">
            <h1 class="demo__title">Base Controls — Demo</h1>
            <p class="demo__subtitle">
                Kiến trúc 3 tầng: <code>useXxxStore</code> → <code>BaseXxx</code> → sub-components.
            </p>

            <!-- Tab switcher -->
            <div class="demo__tabs" role="tablist">
                <button
                    class="demo__tab"
                    :class="{ 'demo__tab--active': activeTab === 'combobox' }"
                    role="tab"
                    @click="activeTab = 'combobox'"
                >
                    BaseCombobox
                </button>
                <button
                    class="demo__tab"
                    :class="{ 'demo__tab--active': activeTab === 'grid' }"
                    role="tab"
                    @click="activeTab = 'grid'"
                >
                    BaseGridViewer
                </button>
            </div>
        </div>

        <!-- ── Tab: BaseCombobox ─────────────────────────────────────────────── -->
        <div v-show="activeTab === 'combobox'" class="demo__section">
            <div class="demo__card">
                <div class="demo__card-label">Local mode — dữ liệu tĩnh</div>

                <BaseCombobox
                    v-model="form.InventoryItemID"
                    label="Hàng hóa"
                    :store="customerStore"
                    clearIcon
                    autoLoad
                />

                <BaseCombobox
                    v-model="form.InventoryItemID"
                    label="Hàng hóa"
                    :store="inventoryStore"
                    clearIcon
                    autoLoad
                />
            </div>

            <div class="demo__preview">
                <div class="demo__preview-title">form values</div>
                <pre>{{ JSON.stringify(form, null, 2) }}</pre>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, getCurrentInstance } from "vue";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/useComboboxStore";
import authApi from "@/api/modules/authApi";
import { FormatType } from "@/constants";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 5;

// ─── Static data ──────────────────────────────────────────────────────────────

/** Dữ liệu tĩnh cho combobox demo (local mode) */
const staticInventory = [
    { InventoryItemID: "ITM001", InventoryItemCode: "HH001", InventoryItemName: "Bàn phím cơ Cherry MX" },
    { InventoryItemID: "ITM002", InventoryItemCode: "HH002", InventoryItemName: "Chuột gaming Logitech G502" },
    { InventoryItemID: "ITM003", InventoryItemCode: "HH003", InventoryItemName: "Màn hình Dell 27 inch 4K" },
    { InventoryItemID: "ITM004", InventoryItemCode: "HH004", InventoryItemName: "Tai nghe Sony WH-1000XM5" },
    { InventoryItemID: "ITM005", InventoryItemCode: "HH005", InventoryItemName: "Webcam Logitech C920" },
];

/** Cột hiển thị trong grid */
const gridColumns = [
    { field: "InventoryItemCode", label: "Mã hàng", width: 120, sortable: true },
    { field: "InventoryItemName", label: "Tên hàng", sortable: true },
    { field: "UnitName", label: "ĐVT", width: 80 },
    { field: "QuantityBalance", label: "Tồn kho", width: 160, sortable: true, align: "right" as const },
    { field: "Status", label: "Trạng thái", width: 110, align: "center" as const },
];

export default defineComponent({
    name: "Dashboard",

    setup() {
        // ─── Tab state ────────────────────────────────────────────────────────────

        /** Tab đang active */
        const activeTab = ref<"combobox" | "grid">("combobox");

        // ─── Combobox demo ────────────────────────────────────────────────────────

        // Sau
        const customerStore = useComboboxStore("inventory_item_demo", {
            viewOrTableName: "di_inventory_item",
            comboboxLoadData: (pay) => loadDataRemoteCombobox(authApi, pay),
            displayField: "InventoryItemName",
            valueField: "InventoryItemID",
            columns: [
                { dataField: "InventoryItemCode", title: "Mã hàng", width: 140 },
                { dataField: "InventoryItemName", title: "Tên hàng", width: 250 },
                {
                    dataField: "BuyPrice",
                    title: "Giá mua",
                    width: 140,
                    formatType: FormatType.Currency,
                    align: "right",
                },
                {
                    dataField: "QuantityBalance",
                    title: "Tồn kho",
                    width: 140,
                    formatType: FormatType.Quantity,
                    align: "right",
                },
            ],
        });
        const inventoryStore = useComboboxStore("inventory_item_demo", {
            viewOrTableName: "di_inventory_item",
            comboboxLoadData: (pay) => loadDataRemoteCombobox(authApi, pay),
            displayField: "InventoryItemName",
            valueField: "InventoryItemID",
        });

        const form = reactive({
            InventoryItemID: "38b7c845-26d8-11f1-8a3c-04d4c4e01d9d" as string | null,
        });

        /** Từ khóa tìm kiếm */
        const searchKeyword = ref("");

        /** Dòng đang được chọn */
        const selectedRow = ref<any>(null);

        /** Event log để minh họa emit */
        const eventLog = reactive<{ type: string; payload: any }[]>([]);

        // ─── Actions ──────────────────────────────────────────────────────────────

        // ─── Lifecycle ────────────────────────────────────────────────────────────

        const { proxy } = getCurrentInstance()!;

        onMounted(() => {
            // Gắn proxy lên window để truy cập global từ bên ngoài component
            (window as any).dashboard = proxy;
        });

        return {
            // Constants
            PAGE_SIZE,
            gridColumns,
            staticInventory,
            // State
            activeTab,
            form,
            customerStore,
            searchKeyword,
            selectedRow,
            eventLog,
            inventoryStore,
        };
    },
});
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base" as *;
$primary: #f48632;
$primary-light: rgba(244, 134, 50, 0.09);
$border: #e2e2e2;
$radius: 6px;
$font: "Segoe UI", system-ui, sans-serif;

// ─── Root ──────────────────────────────────────────────────────────────────────

.demo {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 24px 60px;
    font-family: $font;
    font-size: 13px;
    color: #2a2a2a;
}

// ─── Header ────────────────────────────────────────────────────────────────────

.demo__header {
    margin-bottom: 28px;
}

.demo__title {
    font-size: 22px;
    font-weight: 700;
    color: $primary-color;
    margin: 0 0 6px;
}

.demo__subtitle {
    color: #888;
    margin: 0 0 24px;

    code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: $primary-color;
    }
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

.demo__tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid $border;
}

.demo__tab {
    padding: 9px 20px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 13px;
    font-family: $font;
    font-weight: 500;
    color: #999;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition:
        color 0.15s ease,
        border-color 0.15s ease;

    &--active {
        color: $primary-color;
        border-bottom-color: $primary-color;
        font-weight: 600;
    }

    &:hover:not(&--active) {
        color: #555;
    }
}

// ─── Section ───────────────────────────────────────────────────────────────────

.demo__section {
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

// ─── Combobox card ─────────────────────────────────────────────────────────────

.demo__card {
    background: #fff;
    border: 1px solid $border;
    border-radius: $radius;
    padding: 20px;
}

.demo__card-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #aaa;
    margin-bottom: 14px;
}

// ─── Toolbar ───────────────────────────────────────────────────────────────────

.demo__toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.demo__search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
}

.demo__search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #aaa;
    pointer-events: none;
}

.demo__search {
    width: 100%;
    height: 34px;
    padding: 0 12px 0 32px;
    border: 1px solid $border;
    border-radius: $radius;
    font-size: 13px;
    font-family: $font;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
    color: inherit;
    background: #fff;

    &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.15);
    }

    &::placeholder {
        color: #bbb;
    }
}

// ─── Badges ────────────────────────────────────────────────────────────────────

.demo__badges {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.demo__badge {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 12px;
    font-size: 12px;
    background: #f5f5f5;
    color: #666;
    transition: opacity 0.2s ease;

    &--accent {
        background: $primary-light;
        color: $primary-color;
        font-weight: 600;
    }
}

// ─── Status badge (cell) ────────────────────────────────────────────────────────

.demo__badge-status {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;

    &--active {
        background: rgba(34, 197, 94, 0.12);
        color: #16a34a;
    }

    &--low {
        background: rgba(234, 179, 8, 0.15);
        color: #b45309;
    }

    &--out {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
    }
}

// ─── Stock cell ────────────────────────────────────────────────────────────────

.demo__stock-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    align-items: flex-end;
}

.demo__stock-num {
    font-variant-numeric: tabular-nums;
    font-weight: 500;
}

.demo__stock-bar {
    width: 60px;
    height: 4px;
    background: #ebebeb;
    border-radius: 2px;
    overflow: hidden;
}

.demo__stock-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;

    &--ok {
        background: #22c55e;
    }
    &--low {
        background: #f59e0b;
    }
    &--out {
        background: #ef4444;
    }
}

// ─── Detail panel ──────────────────────────────────────────────────────────────

.demo__detail {
    background: #fff;
    border: 1px solid $border;
    border-left: 3px solid $primary;
    border-radius: $radius;
    overflow: hidden;
}

.demo__detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #fafafa;
    border-bottom: 1px solid $border;
}

.demo__detail-title {
    font-weight: 600;
    font-size: 13px;
    color: $primary-color;
}

.demo__detail-close {
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    color: #aaa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        background 0.12s ease,
        color 0.12s ease;

    &:hover {
        background: rgba($primary-color, 0.1);
        color: $primary-color;
    }
}

.demo__detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0;
    padding: 4px 0;
}

.demo__detail-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 16px;
    border-bottom: 1px solid rgba($border, 0.6);
}

.demo__detail-key {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #aaa;
}

.demo__detail-val {
    font-size: 13px;
    color: #333;
    font-weight: 500;
}

// ─── Preview (event log) ───────────────────────────────────────────────────────

.demo__preview {
    background: #1a1a2e;
    border-radius: $radius;
    overflow: hidden;
}

.demo__preview-title {
    padding: 8px 16px;
    background: #16213e;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #555;
}

.demo__preview pre {
    margin: 0;
    padding: 16px;
    color: #a5d6a7;
    font-size: 12px;
    font-family: monospace;
    max-height: 200px;
    overflow-y: auto;
}

// ─── Transition: row detail ────────────────────────────────────────────────────

.demo-detail-enter-active,
.demo-detail-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.demo-detail-enter-from,
.demo-detail-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>
