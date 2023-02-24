<script setup lang="ts">
const { settings } = storeToRefs(useSettings());
</script>

<template>
  <section class="settings">
    <fieldset>
      <legend>Vowel</legend>
      <VowelSelector />
    </fieldset>

    <fieldset>
      <legend>Tilt</legend>
      <div>
        <input type="range" v-model="settings.tilt" min="-20" max="6" step=".25" />
        <label>{{ settings.tilt }}</label>
      </div>
    </fieldset>

    <fieldset class="stack">
      <legend>
        <input type="checkbox" v-model="settings.vibrato.on" />
        Vibrato
      </legend>

      <div>
        <label>Rate</label>
        <input type="range" v-model="settings.vibrato.rate" min="0" max="8" step=".25" />
        <label>{{ settings.vibrato.rate }}</label>
      </div>

      <div>
        <label>Extent</label>
        <input type="range" v-model="settings.vibrato.extent" min="0" max="3" step=".25" />
        <label>{{ settings.vibrato.extent }}</label>
      </div>
    </fieldset>

    <fieldset
      v-for="(fspec, i) in settings.formantSpecs[settings.vowel]"
      :key="`F${i+1}`"
    >
      <legend>
        <input type="checkbox" v-model="fspec.on" />
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
  flex-direction: column;
  flex-wrap: wrap;
  height: 150px;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  gap: 20px;
  fieldset {
    legend {
      position: relative;
      top: 3px;
    }
    input[type=checkbox] {
      zoom: 1.4;
      vertical-align: -3px;
    }
    &.stack {
      flex-direction: column;
    }
    div {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 15px;
    }
    display: flex;
    flex-direction: row;
    gap: 10px;
    font-size: medium;
    border: 1px solid #ccc;
    input, label {
      display: inline-block;
    }
  }
}
</style>
