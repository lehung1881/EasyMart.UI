<template>
    <BasePopup
        :title="$t('i18nUnit.Detail.Title')"
        width="520px"
        :show-icon-close="true"
        @beforeOpen="beforeOpen"
        :params="{}"
    >
        <template #content>
            <div class="unit-detail flex flex-col gap-4">
                <BaseInput v-model="model.UnitName" :label="$t('i18nUnit.Detail.UnitName')" class="w-full" />
                <BaseTextArea v-model="model.Description" :label="$t('i18nCommon.Description')" class="w-full" />
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
import BasePopup from "@/components/popup/BasePopup.vue";
import unitAPI from "@/api/modules/dictionary/unitAPI";
import { useBaseDetail } from "@/composables/base/useBaseDetail";
import UnitModel from "@/models/dictionary/unit";

const { model, saving, saveAndClose, beforeOpen } = useBaseDetail<UnitModel>({
    formID: "UnitDetail",
    api: unitAPI,
    createDefaultData: () => new UnitModel(),
    transformBeforeSave: ({ model: currentModel }) => ({
        Status: currentModel.Status ?? 1,
    }),
});
</script>

<style scoped lang="scss">
.unit-detail {
    height: 100%;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>

