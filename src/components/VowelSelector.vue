<script setup lang="ts">
import type { Vowel } from '../stores/useVowel';
import { VOWEL_WORDS } from '../stores/useVowel';

const emit = defineEmits(['change']);
const { vowel } = storeToRefs(useVowel());

const items = computed(() => Object.values(Vowels).map(v => ({
  value: v,
  title: `${v} (${VOWEL_WORDS[v as Vowel]})`,
})));
</script>

<template>
  <section class="vowel-selector">
    <v-select v-model="vowel" :items="items" label="Vowel" @update:model-value="emit('change', $event)" />
  </section>
</template>

<style scoped>
.vowel-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
