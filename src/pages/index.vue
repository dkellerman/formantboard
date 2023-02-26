<script setup lang="ts">
import type { Vowel } from '../stores/useSettings';
import PianoBar from '../components/PianoBar.vue';
import Keyboard from '../components/Keyboard.vue';
import Player from '../components/Player.vue';
import { useApp } from '../stores/useApp';

const { settings, keyboard, player, bar, vowel } = storeToRefs(useApp());
</script>

<template>
  <section>
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
}
</style>
