<template>
    <RouterView />
    <DialogWrapper />
    <ModalsContainer />
    <BaseToastMessage />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import { DialogWrapper } from "vue3-promise-dialog";
import { ModalsContainer } from "vue-final-modal";
import BaseToastMessage from "@/components/messagebox/BaseToastMessage.vue";
</script>

<style lang="scss"></style>
