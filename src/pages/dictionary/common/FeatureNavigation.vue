<template>
    <div class="flex justify-between search-bar">
        <div class="flex gap-2"></div>
        <div class="flex gap-2">
            <BaseInput
                v-model="searchKeyword"
                size="sm"
                :placeholder="$t('i18nCommon.SearchPlaceholder')"
                @change="onSearch"
            />
            <BaseButton size="sm" @click="refresh" icon-left="icon-refresh rotate-y-180"></BaseButton>
            <BaseButton size="sm" icon-left="icon-filter" @click="deleteItem"></BaseButton>
            <BaseButton size="sm" icon-left="icon-setting scale-[0.85]"></BaseButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from "vue";
</script>

<style lang="scss" scoped>
@use "@/assets/styles/dictionary.scss";
</style>
