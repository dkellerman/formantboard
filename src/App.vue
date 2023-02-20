<script setup lang="ts">
import Piano from './components/Piano.vue';
import SettingsPanel from './components/SettingsPanel.vue';
</script>

<template>
  <nav>
    <h3>VocalBoard</h3>
  </nav>
  <main>
    <SettingsPanel />
    <Piano />
  </main>
</template>

<style scoped lang="scss">
nav {
  background: aliceblue;
  padding: 0;
  margin: 0;

  h3,
  h3 a {
    width: 100%;
    padding: 0;
    margin: 3px;
    text-align: center !important;
    border: 0;
    color: forestgreen;
    font-weight: bold;
    font-variant: small-caps;
  }
}
main {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
