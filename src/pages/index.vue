<script setup lang="ts">
import type { Vowel } from '../stores/useSettings';
import PianoBar from '../components/PianoBar.vue';
import Keyboard from '../components/Keyboard.vue';
import Player from '../components/Player.vue';
import VowelSelector from '../components/VowelSelector.vue';
import MidiInput from '../components/MidiInput.vue';
import { useApp } from '../stores/useApp';

const { settings, keyboard, player, bar, vowel, midi } = storeToRefs(useApp());
</script>

<template>
  <section>
    <div class="settings">
      <VowelSelector @change="vowel = $event" />
      <MidiInput ref="midi" @note-on="keyboard?.play" @note-off="keyboard?.stop" />
    </div>

    <PianoBar
      ref="bar"
      :harmonics="player?.harmonics ?? []"
      :formant-spec="settings.formantSpecs[vowel as Vowel ?? settings.defaultVowel]"
      :width="keyboard?.width"
    />
    <Keyboard
      ref="keyboard"
      @play="(f, v) => player?.play(f, v)"
      @stop="(f) => player?.stop(f)"
    />
    <Player ref="player" />
  </section>
</template>

<style scoped lang="scss">
section {
  display: flex;
  flex-direction: column;
  align-items: center;

  .settings {
    width: 100%;
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    margin-bottom: 20px;
    .vowel-selector {
      display: none;
    }
  }
}
</style>
