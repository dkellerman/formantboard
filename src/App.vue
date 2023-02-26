<script setup lang="ts">
import { useApp } from './stores/useApp';
import VowelSelector from './components/VowelSelector.vue';

const { keyboard, midi, vowel } = storeToRefs(useApp());
</script>

<template>
  <v-layout>
    <v-app-bar>
      <v-app-bar-title>FormantBoard</v-app-bar-title>
      <MidiInput ref="midi" @note-on="keyboard?.play" @note-off="keyboard?.stop" />
      <VowelSelector @change="vowel = $event" />
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<style scoped lang="scss">
.vowel {
  display: none;
}
.midi {
  margin-right: 20px;
}
</style>
