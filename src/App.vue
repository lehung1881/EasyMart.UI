<template>
    <RouterView />
    <DialogWrapper />
    <ModalsContainer />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import { DialogWrapper } from "vue3-promise-dialog";
import { ModalsContainer } from "vue-final-modal";
</script>

<style lang="scss"></style>
