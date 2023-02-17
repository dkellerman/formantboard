<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSettings } from '../stores/useSettings';

const { settings } = storeToRefs(useSettings());
</script>

<template>
  <h3>Keys</h3>
  <div>Foo: {{ settings.foo }}</div>
</template>

<style scoped lang="scss"></style>
