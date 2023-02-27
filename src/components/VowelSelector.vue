<script setup lang="ts">
import { useApp } from '../stores/useApp';
import type { Vowel } from '../stores/useSettings';
import { Vowels } from '../stores/useSettings';

const WORDS: Record<Vowel, string> = {
  [Vowels.i]: "fleece",
  [Vowels.ɪ]: "kit",
  [Vowels.ɛ]: "dress",
  [Vowels.æ]: "trap",
  [Vowels.ɑ]: "father",
  [Vowels.ɔ]: "thought",
  [Vowels.ʊ]: "foot",
  [Vowels.u]: "goose",
  [Vowels.ə]: "sofa",
};

const { vowel } = storeToRefs(useApp());

const items = computed(() => Object.values(Vowels).map(vowel => ({
  value: vowel,
  title: `${vowel} (${WORDS[vowel as Vowel]})`,
})));
console.log(items);
</script>

<template>
  <section class="vowel-selector">
    <v-select
      v-model="vowel"
      :items="items"
      variant="outlined"
      label="Vowel"
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
