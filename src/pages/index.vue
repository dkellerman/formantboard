<script setup lang="ts">
import Keyboard from '../components/Keyboard.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import Visualizer from '../components/Visualizer.vue';

const player = usePlayer();
const { settings } = storeToRefs(useSettings());
const { visType } = storeToRefs(useVisType());
const keyboard = ref<InstanceType<typeof Keyboard>>();
</script>

<template>
  <section class="flex flex-col items-center gap-0">
    <div class="w-[95vw]">
      <SettingsPanel v-if="keyboard" ref="settingsPanel" class="mb-3" />
      <Visualizer v-if="keyboard && settings.viz.on" :vtype="visType" :height="150" />
      <Keyboard
        ref="keyboard"
        @key-on="(note: string, v) => player.play(note, v)"
        @key-off="(note: string) => player?.stop(note)"
      />
    </div>
    <div class="my-10 inline-flex gap-5">
      <MidiButton :keyboard="keyboard" text="MIDI" />
      <MicButton start-text="Listen" stop-text="Stop" />
    </div>
    <Readout />
  </section>
</template>
