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

    <fieldset>
      <legend>Formants</legend>
      <table>
        <tr
          v-for="(fspec, i) in settings.formantSpecs[settings.vowel]"
          :key="`F${i}`"
        >
          <td>
            <input
              type="checkbox"
              v-model="fspec.on"
            >
          </td>
          <td>{{ `F${i}` }}:</td>
          <td>
            {{ Math.round(fspec.frequency - (fspec.frequency * fspec.Q)) }} -
            {{ Math.round(fspec.frequency + (fspec.frequency * fspec.Q)) }}hz
          </td>
        </tr>
      </table>
    </fieldset>
  </section>
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 20px;
  fieldset {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    font-size: medium;
  }
}
</style>
