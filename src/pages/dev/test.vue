<script setup lang="ts">
const freqs = [439,440,441,410];
</script>

<template>
  <div v-for="f of freqs" :key="f">
    {{ f }} : {{ freq2noteCents(f) }}
  </div>
</template>
