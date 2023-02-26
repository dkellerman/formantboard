<script setup lang="ts">
import type { Vowel } from 'stores/useSettings';
import { Vowels } from 'stores/useSettings';

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

const { settings } = storeToRefs(useSettings());
</script>

<template>
  <div class="compact">
    <select v-model="settings.vowel">
      <option v-for="vowel in Object.keys(Vowels)" :key="vowel" :value="vowel">
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
