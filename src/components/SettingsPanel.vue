<script setup lang="ts">
import { useApp } from '../stores/useApp';
const { keyboard } = storeToRefs(useApp());
</script>

<template>
  <section class="settings">
    <VowelSelector />
    <MidiInput ref="midi" @note-on="keyboard?.play" @note-off="keyboard?.stop" />
  </section>
</template>

<style scoped lang="scss">
.settings {
  width: 100%;
  padding: 0 20px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  .midi {
    flex: 1;
    text-align: right;
  }
}
</style>
