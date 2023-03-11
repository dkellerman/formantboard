<script setup lang="ts">
const test = ref("Test");
</script>

<template>
  <section class="foo">
    <h1>{{ test }}</h1>
  </section>
</template>

<style lang="scss" scoped>
section {
  padding: 20px;
}
</style>
