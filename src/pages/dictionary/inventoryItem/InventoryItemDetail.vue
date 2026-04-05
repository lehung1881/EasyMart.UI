<template>
    <BasePopup title="Thêm mới hàng hóa" width="720px" :show-icon-close="true" @beforeOpen="beforeOpen">
        <template #content>
            <div class="inventory-item-detail">
                <div class="detail-tabs">
                    <div
                        v-for="tab in tabs"
                        :key="tab.key"
                        type="button"
                        class="detail-tab flex items-center"
                        :class="{ 'detail-tab--active': activeTab === tab.key }"
                        @click="setActiveTab(tab.key)"
                    >
                        {{ tab.label }}
                    </div>
                </div>

                <div v-if="activeTab === 'general'" class="detail-grid">
                    <BaseInput v-model="model.InventoryItemCode" label="Mã hàng hóa" placeholder="Nhập mã hàng hóa" />
                    <BaseInput v-model="model.InventoryItemName" label="Tên hàng hóa" placeholder="Nhập tên hàng hóa" />
                    <BaseInput
                        v-model="model.InventoryItemCategoryNameList"
                        label="Nhóm hàng"
                        placeholder="Nhập nhóm hàng"
                    />
                    <BaseInput v-model="model.Description" label="Mô tả" placeholder="Nhập mô tả hàng hóa" />
                </div>

                <div v-else-if="activeTab === 'stockNorm'" class="detail-grid">
                    <BaseInput v-model="model.MinimumStock" type="number" label="Tồn kho tối thiểu" placeholder="0" />
                    <BaseInput v-model="model.MaximumStock" type="number" label="Tồn kho tối đa" placeholder="0" />
                    <BaseInput v-model="model.QuantityBalance" type="number" label="Tồn kho hiện tại" placeholder="0" />
                    <BaseInput
                        v-model="model.QuantityAvailable"
                        type="number"
                        label="Số lượng khả dụng"
                        placeholder="0"
                    />
                </div>

                <div v-else class="detail-grid">
                    <BaseInput v-model="model.BuyPrice" type="number" label="Giá vốn" placeholder="0" />
                    <BaseInput v-model="model.SellPrice" type="number" label="Giá bán" placeholder="0" />
                    <BaseInput
                        v-model="model.ReleaseMethod"
                        type="number"
                        label="Phương pháp tính giá xuất"
                        placeholder="0"
                    />
                    <BaseInput v-model="model.WarrantyTime" type="number" label="Thời gian bảo hành" placeholder="0" />
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">Hủy</BaseButton>
                <BaseButton size="md" variant="primary" :disabled="saving" @click="saveAndClose(close)">Lưu</BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script setup lang="ts">
import { ref } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemApi";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import InventoryItemModel from "@/models/dictionary/inventoryItem";
import { showError, showSuccess } from "@/commons/messageBox";

type InventoryDetailTab = "general" | "stockNorm" | "supplier" | "defaultInfo";

const tabs: Array<{ key: InventoryDetailTab; label: string }> = [
    { key: "general", label: "Thông tin chung" },
    { key: "stockNorm", label: "Định mức tồn kho" },
    { key: "supplier", label: "Nhà cung cấp" },
    { key: "defaultInfo", label: "Thông tin ngầm định" },
];

const activeTab = ref<InventoryDetailTab>("general");

const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<InventoryItemModel>({
    formID: "InventoryItemDetail",
    api: inventoryItemApi,
    createDefaultData: () => new InventoryItemModel(),
});

/**
 * Chuyển tab đang hiển thị trên form chi tiết hàng hóa.
 * @param tabKey Mã tab cần chuyển sang.
 * @returns Không trả về dữ liệu.
 */
const setActiveTab = (tabKey: InventoryDetailTab): void => {
    activeTab.value = tabKey;
};
</script>

<style scoped lang="scss">
.inventory-item-detail {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.detail-tabs {
    display: flex;
    align-items: center;
    gap: 0;
    border-bottom: 1px solid #d1d5db;
}

.detail-tab {
    height: 24px;
    padding: 0 12px;
    border: 0;
    border-bottom: 2px solid transparent;
    font-weight: 500;
    font-size: 14px;
    color: #111827;
    line-height: 1;
    cursor: pointer;
}

.detail-tab--active {
    color: $primary-color;
    border-bottom-color: $primary-color;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
