<script setup lang="ts"></script>

<template>
  <nav>
    <h3>FormantBoard</h3>
  </nav>

  <main>
    <router-view />
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
    text-align: left;
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
  width: 100%;
}
</style>
