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
    <div class="divider" />
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
    width: 100%;
    text-align: center;
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
  align-items: flex-start;
  .divider {
    width: 100%;
    border-bottom: 1px solid #ddd;
    margin-bottom: 30px;
  }
  .piano {
    margin-bottom: 60px;
  }
}
</style>
