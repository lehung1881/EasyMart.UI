<template>
    <BasePopup title="Thêm mới hàng hóa" width="920px" :show-icon-close="true">
        <template #content>
            <div class="inventory-item-detail">
                <div class="detail-grid">
                    <BaseInput
                        v-model="model.InventoryItemCode"
                        label="Mã hàng hóa"
                        placeholder="Nhập mã hàng hóa"
                    />
                    <BaseInput
                        v-model="model.InventoryItemName"
                        label="Tên hàng hóa"
                        placeholder="Nhập tên hàng hóa"
                    />
                    <BaseInput v-model="model.UnitName" label="Đơn vị tính" placeholder="Ví dụ: Cái, Hộp..." />
                    <BaseInput
                        v-model="model.InventoryItemCategoryNameList"
                        label="Nhóm hàng"
                        placeholder="Nhập nhóm hàng"
                    />
                    <BaseInput v-model="model.BuyPrice" type="number" label="Giá vốn" placeholder="0" />
                    <BaseInput v-model="model.SellPrice" type="number" label="Giá bán" placeholder="0" />
                </div>

                <div class="description-wrapper">
                    <BaseInput v-model="model.Description" label="Mô tả" placeholder="Nhập mô tả hàng hóa" />
                </div>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">Hủy</BaseButton>
                <BaseButton size="md" variant="primary" :disabled="saving" @click="onSave(close)">Lưu</BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script setup lang="ts">
import BasePopup from "@/components/popup/BasePopup.vue";
import inventoryItemApi from "@/api/modules/dictionary/inventoryItemApi";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import InventoryItemModel from "@/models/dictionary/inventoryItem";
import { showError, showSuccess } from "@/commons/messageBox";

const { model, saveAndClose, saving, createItem } = useBaseDetail<InventoryItemModel>({
    api: inventoryItemApi,
    createDefaultData: () => new InventoryItemModel(),
    validateBeforeSave: ({ model }) => {
        return Boolean(model.InventoryItemCode?.trim() && model.InventoryItemName?.trim());
    },
    onSaveSuccess: async () => {
        await showSuccess("Lưu hàng hóa thành công");
    },
    onSaveError: async () => {
        await showError("Lưu hàng hóa thất bại");
    },
});

createItem();

/**
 * Kiểm tra bắt buộc nhập mã và tên hàng hóa trước khi lưu.
 * @returns `true` nếu dữ liệu tối thiểu hợp lệ, ngược lại `false`.
 */
const hasRequiredFields = (): boolean => {
    return Boolean(model.InventoryItemCode?.trim() && model.InventoryItemName?.trim());
};

/**
 * Xử lý lưu dữ liệu hàng hóa ở màn thêm mới.
 * @param close Hàm đóng popup do `BasePopup` cung cấp.
 * @returns Không trả về dữ liệu.
 */
const onSave = async (close: () => void): Promise<void> => {
    if (!hasRequiredFields()) {
        await showError("Vui lòng nhập đầy đủ mã và tên hàng hóa");
        return;
    }

    await saveAndClose(close);
};
</script>

<style scoped lang="scss">
.inventory-item-detail {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.description-wrapper {
    width: 100%;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

@media (max-width: 992px) {
    .detail-grid {
        grid-template-columns: 1fr;
    }
}
</style>
