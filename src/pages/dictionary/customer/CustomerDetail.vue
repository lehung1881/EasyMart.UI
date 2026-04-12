<template>
    <BasePopup width="680px" :show-icon-close="true" @beforeOpen="beforeOpen" :params="{}">
        <template #header>
            <div class="modal-header-custom flex items-center gap-4 min-h-[56px] pr-14">
                <div class="text-xl font-bold">{{ $t("i18nCustomer.Detail.Title") }}</div>
                <BaseRadioGroup v-model="model.CustomerType" :options="customerTypeOptions" />
            </div>
        </template>

        <template #content>
            <div class="customer-detail flex flex-col gap-4">
                <div class="flex gap-3 max-md:flex-col">
                    <div class="flex gap-2 w-1/2 max-md:w-full">
                        <BaseInput v-model="model.TaxCode" :label="$t('i18nCustomer.Detail.TaxCode')" class="w-1/2" />
                        <BaseInput
                            v-model="model.CustomerCode"
                            :label="$t('i18nCustomer.Detail.CustomerCode')"
                            class="w-1/2"
                        />
                    </div>
                    <div class="w-1/2 max-md:w-full">
                        <BaseInput v-model="model.CustomerName" :label="$t('i18nCustomer.Detail.CustomerName')" />
                    </div>
                </div>

                <div class="flex gap-3 max-md:flex-col">
                    <BaseInput
                        v-model="model.Email"
                        :label="$t('i18nCustomer.Detail.Email')"
                        class="w-1/2 max-md:w-full"
                    />
                    <BaseInput
                        v-model="model.PhoneNumber"
                        :label="$t('i18nCustomer.Detail.PhoneNumber')"
                        class="w-1/2 max-md:w-full"
                    />
                </div>

                <BaseTextArea v-model="model.Address" :label="$t('i18nCustomer.Detail.Address')" class="w-full" />
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
import customerAPI from "@/api/modules/dictionary/customerAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import CustomerModel from "@/models/dictionary/customer";

const { proxy } = getCurrentInstance() as any;

const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<CustomerModel>({
    formID: "CustomerDetail",
    api: customerAPI,
    createDefaultData: () => new CustomerModel(),
    transformBeforeSave: ({ model: currentModel }) => ({
        Status: currentModel.Status ?? 1,
    }),
});

const customerTypeOptions = computed(() => [
    { label: proxy.$t("i18nCustomer.Detail.Individual"), value: 0 },
    { label: proxy.$t("i18nCustomer.Detail.Enterprise"), value: 1 },
]);
</script>

<style scoped lang="scss">
.customer-detail {
    height: 100%;
    margin-top: 8px;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
