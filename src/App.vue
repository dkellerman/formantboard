<script setup lang="ts">
import Piano from './components/Piano.vue';
import SettingsPanel from './components/SettingsPanel.vue';
</script>

<template>
  <nav>
    <h3>FormantBoard</h3>
  </nav>
  <main>
    <Piano />
    <hr>
    <SettingsPanel />
  </main>
</template>

<style scoped lang="scss">
nav {
  background: aliceblue;
  padding: 0;
  margin: 0;

  h3,
  h3 a {
    text-align: center;
    width: 100%;
    padding: 0;
    margin: 3px 25px;
    border: 0;
    color: forestgreen;
    font-weight: bold;
    font-variant: small-caps;
  }
}
main {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}
</style>
