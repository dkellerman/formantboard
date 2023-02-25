<script setup lang="ts">
const { audioContext } = useSettings();
</script>

<template>
  <v-layout>
    <v-app-bar>
      <v-app-bar-title>FormantBoard</v-app-bar-title>
      <v-btn
        v-if="audioContext.state === 'suspended'"
        variant="outlined"
        @click="audioContext.resume()"
      >Enable MIDI</v-btn>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<style scoped lang="scss">
</style>
