<script setup lang="ts">
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

const emit = defineEmits<{
  (e: 'change', value: Vowel): void;
}>();

const items = computed(() => Object.keys(Vowels).map(v => ({
  title: `${Vowels[Vowels[v as Vowel]]} (${WORDS[v as Vowel]})`,
  value: v,
})));
</script>

<template>
  <section class="vowel">
    <v-select label="Vowel" :items="items" @change="emit('change', $event.value)" />
  </section>
</template>

<style scoped></style>
