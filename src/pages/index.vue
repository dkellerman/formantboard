<script setup lang="ts">
import type { Vowel } from '../stores/useSettings';
import PianoBar from '../components/PianoBar.vue';
import Keyboard from '../components/Keyboard.vue';
import { useApp } from '../stores/useApp';
import SettingsPanel from '../components/SettingsPanel.vue';
import Visualizer from '../components/Visualizer.vue';
import { usePlayer } from '../stores/usePlayer';

const { settings, keyboard, bar, vowel, visualizer, settingsPanel } = storeToRefs(useApp());
const player = usePlayer();
</script>

<template>
  <section>
    <template v-if="player && keyboard">
      <SettingsPanel ref="settingsPanel" />
      <Visualizer v-if="settings.viz.on" ref="visualizer" :input="player.master" :width="keyboard.width" />
      <PianoBar
        ref="bar"
        :harmonics="player.harmonics ?? []"
        :formant-spec="settings.formantSpecs[vowel as Vowel]"
        :width="keyboard.width"
      />
    </template>
    <Keyboard ref="keyboard" @play="(f, v) => player?.play(f, v)" @stop="(f) => player?.stop(f)" />
  </section>
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
