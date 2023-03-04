<script setup lang="ts">
import type { Vowel } from '../stores/useVowel';

const { vowel } = storeToRefs(useVowel());

const items = computed(() => Object.values(Vowels).map(v => ({
  value: v,
  title: `${vowel} (${VOWEL_WORDS[v as Vowel]})`,
})));

const emit = defineEmits(['change']);

</script>

<template>
  <section class="vowel-selector">
    <v-select
      v-model="vowel"
      :items="items"
      variant="outlined"
      label="Vowel"
      density="compact"
      @change="emit('change', $event)"
    />
  </section>
</template>

<style scoped>
.vowel-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
