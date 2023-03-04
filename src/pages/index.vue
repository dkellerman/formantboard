<script setup lang="ts">
import PianoBar from '../components/PianoBar.vue';
import Keyboard from '../components/Keyboard.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import Visualizer from '../components/Visualizer.vue';

const player = usePlayer();
const { settings } = storeToRefs(useSettings());
const { visType } = storeToRefs(useVisType());
const { vowel } = storeToRefs(useVowel());
const metrics = useMetrics();
const keyboard = ref<InstanceType<typeof Keyboard>>();
</script>

<template>
  <section>
    <template v-if="keyboard">
      <SettingsPanel ref="settingsPanel" />
      <Visualizer v-if="settings.viz.on" :vis-type="visType" :width="keyboard.width" />
      <PianoBar
        :harmonics="metrics.harmonics ?? []"
        :formant-spec="settings.formants.specs[vowel]"
        :width="keyboard.width"
      />
    </template>
    <Keyboard
      ref="keyboard"
      @key-on="(note: string, v) => player.play(note, v)"
      @key-off="(note: string) => player?.stop(note)"
    />
    <MidiButton :keyboard="keyboard" />
  </section>
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: column;
  align-items: center;
  .midi {
    margin-top: 40px;
  }

}
</style>
