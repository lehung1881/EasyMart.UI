<template>
    <BasePopup
        :title="$t('i18nStock.Detail.Title')"
        width="720px"
        :show-icon-close="true"
        @beforeOpen="beforeOpen"
        :params="{}"
    >
        <template #content>
            <div class="stock-detail flex flex-col gap-4">
                <div class="flex gap-4 max-md:flex-col">
                    <BaseInput
                        v-model="model.StockCode"
                        :label="$t('i18nStock.Detail.StockCode')"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInput
                        v-model="model.StockName"
                        :label="$t('i18nStock.Detail.StockName')"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <BaseInput v-model="model.Address" :label="$t('i18nStock.Detail.Address')" class="w-full" />

                <BaseTextArea v-model="model.Description" :label="$t('i18nStock.Detail.Description')" class="w-full" />
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">{{ $t("i18nStock.Detail.Cancel") }}</BaseButton>
                <BaseButton size="md" variant="primary" :disabled="saving" @click="saveAndClose(close)">
                    {{ $t("i18nStock.Detail.Save") }}
                </BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script setup lang="ts">
import BasePopup from "@/components/popup/BasePopup.vue";
import stockAPI from "@/api/modules/dictionary/stockAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import StockModel from "@/models/dictionary/stock";

const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<StockModel>({
    formID: "StockDetail",
    api: stockAPI,
    createDefaultData: () => new StockModel(),
    transformBeforeSave: ({ model: currentModel }) => ({
        Status: currentModel.Status ?? 1,
    }),
});
</script>

<style scoped lang="scss">
@use "@/assets/styles/variable" as *;

.stock-detail {
    height: 100%;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
