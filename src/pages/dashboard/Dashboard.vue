<template>
    <div class="demo">
        <h1 class="demo__title">BaseCombobox — Demo</h1>
        <p class="demo__subtitle">Local và Remote đều dùng store, cấu hình qua <code>comboboxLoadData</code>.</p>

        <div class="demo__form">
            <BaseCombobox
                v-model="form.InventoryItemID"
                label="Hàng hóa"
                displayField="InventoryItemName"
                valueField="InventoryItemID"
                :store="customerStore"
                :columns="[
                    { field: 'InventoryItemCode', label: 'Mã hàng', width: 180 },
                    { field: 'InventoryItemName', label: 'Tên hàng', width: 120 },
                ]"
                clearIcon
            />
        </div>

        <div class="demo__preview">
            <div class="demo__preview-title">Form values</div>
            <pre>{{ JSON.stringify(form, null, 2) }}</pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useComboboxStore, loadDataRemoteCombobox } from "@/composables/useComboboxStore";
import authApi from "@/api/modules/authApi";
import type { PagingRequest } from "@/models/common/paging";

//Xử lý load dữ liệu cho combobox, trả về mảng dữ liệu sau khi đã map lại nếu cần
const loadInventoryItem = async (payload: PagingRequest): Promise<any[]> => {
    payload.columns = `InventoryItemID, ReleaseMethod, UnitID, UnitName, InventoryItemCode, InventoryItemName, 
        InventoryItemType, InventoryItemCategoryIDList, InventoryItemCategoryCodeList,
        InventoryItemCategoryNameList, MaximumStock, MinimumStock, QuantityBalance`;

    if (form.InventoryItemID) {
        payload.selectedValue = {
            property: "InventoryItemID",
            value: form.InventoryItemID,
        };
    }

    payload.sort = [
        {
            property: "InventoryItemCode",
            desc: false,
        },
    ];

    return loadDataRemoteCombobox(authApi, payload);
};

//Khởi tạo store cho combobox
const customerStore = useComboboxStore("inventory_item", {
    comboboxLoadData: loadInventoryItem,
    viewOrTableName: "di_inventory_item",
});

const form = reactive({
    InventoryItemID: null as string | null,
});
</script>

<style lang="scss" scoped>
$primary: #f48632;

.demo {
    max-width: 560px;
    margin: 0 auto;
    padding: 40px 24px;
    font-family: "Segoe UI", system-ui, sans-serif;
    font-size: 13px;

    &__title {
        font-size: 20px;
        font-weight: 700;
        color: $primary;
        margin: 0 0 6px;
    }

    &__subtitle {
        color: #888;
        margin: 0 0 32px;

        code {
            background: #f5f5f5;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 12px;
        }
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin-bottom: 32px;
    }

    &__preview {
        background: #1a1a2e;
        border-radius: 8px;
        overflow: hidden;

        &-title {
            padding: 8px 16px;
            background: #16213e;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #666;
        }

        pre {
            margin: 0;
            padding: 16px;
            color: #a5d6a7;
            font-size: 12px;
            font-family: monospace;
        }
    }
}
</style>
