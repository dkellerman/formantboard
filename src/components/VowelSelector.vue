<script setup lang="ts">
import { Vowel } from '../types';

const WORDS: Record<Vowel, string> = {
  [Vowel.i]: "fleece",
  [Vowel.ɪ]: "kit",
  [Vowel.ɛ]: "dress",
  [Vowel.æ]: "trap",
  [Vowel.ɑ]: "father",
  [Vowel.ɔ]: "thought",
  [Vowel.ʊ]: "foot",
  [Vowel.u]: "goose",
  [Vowel.ə]: "sofa",
};

const { settings } = storeToRefs(useSettings());
</script>

<template>
  <div class="compact">
    <select v-model="settings.vowel">
      <option v-for="vowel in Object.keys(Vowel)" :key="vowel" :value="vowel">
        {{ vowel }} ({{ WORDS[vowel as Vowel] }})
      </option>
    </select>
  </div>
</template>

<style scoped>
.compact {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}
</style>
