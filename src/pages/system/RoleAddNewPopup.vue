<template>
    <BasePopup :title="$t('i18nSystem.AddNew.Title')" width="480px" :show-icon-close="true" :params="{}">
        <template #content>
            <div class="role-add-new flex flex-col gap-4">
                <BaseInput v-model="roleCode" :label="$t('i18nSystem.AddNew.RoleCode')" class="w-full" />
                <BaseInput v-model="roleName" :label="$t('i18nSystem.AddNew.RoleName')" class="w-full" />
                <BaseTextArea v-model="description" :label="$t('i18nCommon.Description')" class="w-full" :rows="3" />
            </div>
        </template>

        <template #footer="{ close }">
            <div class="popup-footer">
                <BaseButton size="md" @click="close">{{ $t("i18nCommon.Cancel") }}</BaseButton>
                <BaseButton size="md" variant="primary" @click="handleApply(close)">
                    {{ $t("i18nCommon.Add") }}
                </BaseButton>
            </div>
        </template>
    </BasePopup>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import type { PropType } from "vue";
import BasePopup from "@/components/popup/BasePopup.vue";

export default defineComponent({
    name: "RoleAddNewPopup",
    components: { BasePopup },
    props: {
        params: {
            type: Object as PropType<{
                onApply?: (...args: any[]) => any;
            }>,
            default: () => ({}),
        },
    },

    setup(props) {
        const roleCode = ref("");
        const roleName = ref("");
        const description = ref("");

        const handleApply = (close: () => void) => {
            props.params?.onApply?.({
                RoleCode: roleCode.value,
                RoleName: roleName.value,
                Description: description.value,
            });

            close();
        };

        return {
            roleCode,
            roleName,
            description,
            handleApply,
        };
    },
});
</script>

<style scoped lang="scss">
.role-add-new {
    height: 100%;
    padding: 0 16px;
}

.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
