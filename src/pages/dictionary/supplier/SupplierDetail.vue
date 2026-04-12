<template>
    <BasePopup width="760px" :show-icon-close="true" @beforeOpen="beforeOpen" :params="{}">
        <template #header>
            <div class="modal-header-custom flex items-center gap-4 min-h-14 pr-14">
                <div class="text-xl font-bold">{{ $t("i18nSupplier.Detail.Title") }}</div>
                <BaseRadioGroup v-model="model.SupplierType" :options="supplierTypeOptions" />
            </div>
        </template>

        <template #content>
            <div class="supplier-detail flex flex-col gap-4">
                <div class="flex gap-4 max-md:flex-col">
                    <div class="flex gap-4 w-1/2 max-md:w-full">
                        <BaseInput v-model="model.TaxCode" :label="$t('i18nSupplier.Detail.TaxCode')" class="w-1/2" />
                        <BaseInput
                            v-model="model.SupplierCode"
                            :label="$t('i18nSupplier.Detail.SupplierCode')"
                            class="w-1/2"
                        />
                    </div>
                    <BaseInput
                        v-model="model.SupplierName"
                        :label="$t('i18nSupplier.Detail.SupplierName')"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <div class="flex gap-4 max-md:flex-col">
                    <BaseInput
                        v-model="model.PhoneNumber"
                        :label="$t('i18nSupplier.Detail.PhoneNumber')"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInput
                        v-model="model.Email"
                        :label="$t('i18nSupplier.Detail.Email')"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <BaseTextArea v-model="model.Address" :label="$t('i18nSupplier.Detail.Address')" class="w-full" />
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">{{ $t("i18nCommon.Cancel") }}</BaseButton>
                <BaseButton size="md" variant="primary" :disabled="saving" @click="saveAndClose(close)">
                    {{ $t("i18nCommon.Save") }}
                </BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";
import supplierAPI from "@/api/modules/dictionary/supplierAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import SupplierModel from "@/models/dictionary/supplier";

const { proxy } = getCurrentInstance() as any;

const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<SupplierModel>({
    formID: "SupplierDetail",
    api: supplierAPI,
    createDefaultData: () => new SupplierModel(),
    transformBeforeSave: ({ model: currentModel }) => ({
        Status: currentModel.Status ?? 1,
    }),
});

const supplierTypeOptions = computed(() => [
    { label: proxy.$t("i18nSupplier.Detail.Individual"), value: 0 },
    { label: proxy.$t("i18nSupplier.Detail.Enterprise"), value: 1 },
]);
</script>

<style scoped lang="scss">
.supplier-detail {
    height: 100%;
    margin-top: 8px;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
