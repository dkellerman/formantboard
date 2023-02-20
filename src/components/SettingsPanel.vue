<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VowelSelector from './VowelSelector.vue';
import { useSettings } from '../stores/useSettings';

const { settings } = storeToRefs(useSettings());
</script>

<template>
  <section>
    <fieldset>
      <legend>Vowel</legend>
      <VowelSelector />
    </fieldset>

    <fieldset>
      <legend>Tilt</legend>
      <input
        type="range"
        v-model="settings.tilt"
        min="-20"
        max="6"
        step=".25"
      >
      <label>{{ settings.tilt }}</label>
    </fieldset>

    <fieldset
      v-for="(fspec, i) in settings.formantSpecs[settings.vowel]"
      :key="`F${i+1}`"
    >
      <legend>
        <input
          type="checkbox"
          v-model="fspec.on"
        >
        {{ `F${i+1}` }}
      </legend>

      <label>
        {{ Math.round(fspec.frequency - (fspec.frequency * fspec.Q)) }} -
        {{ Math.round(fspec.frequency + (fspec.frequency * fspec.Q)) }}hz
      </label>
    </fieldset>
  </section>
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  gap: 20px;
  fieldset {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    font-size: medium;
    border: 1px solid #ccc;
    input, label {
      display: inline-block;
    }
  }
}
</style>
