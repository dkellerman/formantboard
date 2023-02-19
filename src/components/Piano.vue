<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { onKeyStroke } from '@vueuse/core';
import { Note } from 'tonal';
import { WebMidi, Input } from 'webmidi';
import type { NoteMessageEvent } from 'webmidi';
import { Vowel } from '../types';
import { useSettings } from '../stores/useSettings';
import { VocalNode } from '../nodes/VocalNode';

const KEYS = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
const KEY_KEYS = 'qwertyuiopasdfghjklzxcvbnm'.split('');

const ctx = ref<AudioContext>(new AudioContext({ latencyHint: 'interactive' }));
const playing = ref<Record<string, VocalNode>>({});
const vowel = ref(Vowel.a);
const octave = ref<number>(4);
const dragging = ref(false);
const { settings } = storeToRefs(useSettings());

const keys = computed(() => {
  const vals: string[] = ['A0', 'As0', 'B0'];
  for (let o = 1; o <= 7; o++) {
    for (const key of KEYS) vals.push(`${key}${o}`);
  }
  vals.push('C8');
  return vals;
});

const midiIn = computed<Input | null>((): Input | null => {
  const { midiInDeviceId, midiInChannel } = settings.value;
  if (!WebMidi.enabled) return null;

  if (WebMidi.inputs.length > 0) {
    const input = midiInDeviceId ? WebMidi.getInputById(midiInDeviceId) : WebMidi.inputs[0];
    input.addListener(
      'noteon',
      (e: NoteMessageEvent) => {
        play(getNoteName(e.note.number), e.note.attack);
      },
      { channels: midiInChannel ?? undefined }
    );
    input.addListener(
      'noteoff',
      (e: NoteMessageEvent) => {
        stop(getNoteName(e.note.number));
      },
      { channels: midiInChannel ?? undefined }
    );
    return input;
  }

  console.log('no midi inputs');
  return null;
});

function play(keyName: string, velocity = 1.0) {
  console.log('play', keyName, velocity);
  const key = keyName.replace('s', '#');
  if (key in (playing.value ?? {})) return;
  activateKey(key);

  const vocNode = new VocalNode(ctx.value, {
    ...settings.value,
    frequency: Note.freq(key) ?? 0,
    velocity,
    vowel: vowel.value,
  });
  vocNode.connect(ctx.value.destination);
  vocNode.start();
  playing.value[key] = vocNode;
}

function stop(keyName: string) {
  console.log('stop', keyName);
  const key = keyName.replace('s', '#');
  const vocNode = playing.value[key];
  if (vocNode) {
    deactivateKey(key);
    vocNode.stop();
    delete playing.value[key];
  }
}

function activateKey(key: string) {
  const k = getKeyByName(key);
  if (k) {
    k.classList.add('active');
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (k as any).scrollIntoViewIfNeeded?.(false);
  }
}

function deactivateKey(key: string) {
  getKeyByName(key)?.classList.remove('active');
}

function scrollTo(key: string, behavior: 'auto' | 'smooth' = 'auto') {
  getKeyByName(key)?.scrollIntoView({ behavior, inline: 'center' });
}

function getNoteName(n: number) {
  return keys.value[n - 21].replace('s', '#');
}

const getKeyByName = (keyName: string) => {
  const key = keyName.replace('#', 's');
  return document.getElementById(key);
};

function getKeyFromEvent(event: KeyboardEvent) {
  const startIdx = Math.max(keys.value.indexOf(`C${octave.value}`) - 12, 0);
  const keyIdx = KEY_KEYS.indexOf(event.key);
  return keys.value[startIdx + keyIdx];
}

onMounted(async () => {
  await WebMidi.enable();

  scrollTo('C4', 'auto');

  // play key with qwerty keyboard
  onKeyStroke(KEY_KEYS, (event) => play(getKeyFromEvent(event)), { eventName: 'keydown' });
  onKeyStroke(KEY_KEYS, (event) => stop(getKeyFromEvent(event)), { eventName: 'keyup' });

  // octave up/down
  onKeyStroke(['ArrowLeft'], () => {
    octave.value = Math.max(0, octave.value - 1);
    scrollTo(`C${octave.value}`);
  }, { eventName: 'keydown'});
  onKeyStroke(['ArrowRight'], () => {
    octave.value = Math.min(7, octave.value + 1);
    scrollTo(`C${octave.value}`);
  }, { eventName: 'keydown'});
});

onUnmounted(() => {
  midiIn.value?.removeListener();
});
</script>

<template>
  <ul class="keys">
    <li
      v-for="key of keys"
      :id="key"
      :key="key"
      :class="`key ${key.substring(0, key.length - 1)} ${key.includes('s') ? 'black' : 'white'}`"
      @mousedown.prevent="
        dragging = true;
        play(key);
      "
      @mouseup.prevent="
        dragging = false;
        stop(key);
      "
      @mouseenter.prevent="dragging && play(key)"
      @mouseout.prevent="stop(key)"
      v-touch:tap="() => dragging && play(key)"
      v-touch:release="() => stop(key)"
    >
      <label> {{ key.replace('s', '#') }}<br> </label>
    </li>
  </ul>
</template>

<style scoped lang="scss">
$kbdWidth: 100%;
$kbdHeight: 160px;
$blackKeyWidth: 30px;
$whiteKeyHeight: 100%;
$whiteKeyWidth: 50px;
$blackKeyHeight: 57%;
$labelMargin: 20px;

ul {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  height: $kbdHeight;
  width: $kbdWidth;
  overflow: scroll;

  li {
    text-indent: 0;
    &:before {
      display: none;
    }
    height: 100%;
    border: 1px solid #000;
    font-size: small;
    position: relative;

    &.white {
      width: $whiteKeyWidth;
      min-width: $whiteKeyWidth;
      max-width: $whiteKeyWidth;
      height: $whiteKeyHeight;
      color: #000;
      border-left: 1px solid #bbb;
      border-bottom: 1px solid #bbb;
      border-radius: 0 0 5px 5px;
      box-shadow: -1px 0 0 rgba(255, 255, 255, 0.8) inset, 0 0 5px #ccc inset, 0 0 3px rgba(0, 0, 0, 0.2);
      background: linear-gradient(to bottom, #eee 0%, #fff 100%);
      &.active {
        border-top: 1px solid #777;
        border-left: 1px solid #999;
        border-bottom: 1px solid #999;
        box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1) inset, -5px 5px 20px rgba(0, 0, 0, 0.2) inset,
          0 0 3px rgba(0, 0, 0, 0.2);
        background: linear-gradient(to bottom, #fff 0%, #e9e9e9 100%);
      }
      &.C,
      &.D,
      &.F,
      &.G,
      &.A {
        margin-right: -1 * $blackKeyWidth;
      }
    }

    &.black {
      width: $blackKeyWidth;
      min-width: $blackKeyWidth;
      max-width: $blackKeyWidth;
      background-color: #000;
      color: #fff;
      height: $blackKeyHeight;
      position: relative;
      right: -1 * $blackKeyWidth / 2;
      z-index: 2;
      border: 1px solid #000;
      border-radius: 0 0 3px 3px;
      box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -5px 2px 3px rgba(0, 0, 0, 0.6) inset,
        0 2px 4px rgba(0, 0, 0, 0.5);
      background: linear-gradient(45deg, #222 0%, #555 100%);
      &.active {
        box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset, 0 -2px 2px 3px rgba(0, 0, 0, 0.6) inset,
          0 1px 2px rgba(0, 0, 0, 0.5);
        background: linear-gradient(to right, #555 0%, #222 100%);
      }
    }

    label {
      text-align: center;
      height: 100%;
      width: 100%;
      position: relative;
      color: #aaa;
      display: none;
    }
    &.black label {
      top: calc(100% - $labelMargin);
      left: calc(50% - 11px);
    }
    &.white label {
      top: calc(100% - $labelMargin);
      left: calc(50% - 7px);
    }
    &.C label {
      display: initial;
    }
  }
}
</style>
