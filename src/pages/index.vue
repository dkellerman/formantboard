<script setup lang="ts">
import Keyboard from '../components/Keyboard.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import Visualizer from '../components/Visualizer.vue';

const player = usePlayer();
const { settings } = storeToRefs(useSettings());
const { visType } = storeToRefs(useVisType());
const metrics = useMetrics();
const keyboard = ref<InstanceType<typeof Keyboard>>();
</script>

<template>
  <section>
    <template v-if="keyboard">
      <SettingsPanel ref="settingsPanel" />
      <Visualizer v-if="settings.viz.on" :vtype="visType" :width="keyboard.width" :height="200" />
    </template>
    <Keyboard
      ref="keyboard"
      @key-on="(note: string, v) => player.play(note, v)"
      @key-off="(note: string) => player?.stop(note)"
    />
    <div>
      <MidiButton :keyboard="keyboard" text="MIDI" />
      <MicButton start-text="Listen" stop-text="Stop" />
    </div>
    <div v-if="metrics.pitch" style="font-family: monospace; width: 175px">
      {{ metrics.pitch.freq.toFixed(1) }}hz
      [{{ metrics.pitch.note }}
      {{ metrics.pitch.cents > 0 ? '+' : '' }}{{ metrics.pitch.cents }}c]
    </div>
  </section>
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: column;
  align-items: center;
  .midi, .mic {
    margin: 40px 10px;
    display: inline-block;
    vertical-align: top;
  }
}
</style>
