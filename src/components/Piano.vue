<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Note } from 'tonal';
import { WebMidi } from 'webmidi';
import type { NoteMessageEvent, Input } from 'webmidi';

const ctx = ref<AudioContext>(new AudioContext());
const playing = ref<Map<string, OscillatorNode>>(new Map());
const midiIn = ref<Input>();
const midiChannels = ref<number[]>([1]);
const keys = computed(() => {
  const vals: string[] = ['A0', 'As0', 'B0'];
  for (let o = 1; o <= 7; o++) {
    for (const key of ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']) {
      vals.push(`${key}${o}`);
    }
  }
  vals.push('C8');
  return vals;
});

function play(key: string, velocity = 1.0) {
  if (key in (playing.value ?? {})) return;
  const frequency = Note.freq(key) ?? 0;
  const osc = new OscillatorNode(ctx.value, { frequency });
  const g = new GainNode(ctx.value, { gain: velocity });
  osc.connect(g);
  g.connect(ctx.value.destination);
  osc.start(0);
  playing.value.set(key, osc);
  activateKey(key);
}

function stop(key: string) {
  const osc = playing.value.get(key);
  if (osc) {
    osc.stop(0);
    playing.value.delete(key);
  }
  deactivateKey(key);
}

function activateKey(key: string) {
  getKeyByName(key)?.classList.add('active');
  // scrollTo(key, "auto");
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

const getKeyByName = (key: string) => {
  return document.getElementById(key.replace('#', 's'));
};

async function initMidi() {
  await WebMidi.enable();

  if (WebMidi.inputs.length > 0) {
    console.log('midi inputs', WebMidi.inputs);
    midiIn.value = WebMidi.inputs[0];
    midiIn.value.addListener(
      'noteon',
      (e: NoteMessageEvent) => {
        play(getNoteName(e.note.number), e.note.attack);
      },
      { channels: midiChannels.value }
    );
    midiIn.value.addListener(
      'noteoff',
      (e: NoteMessageEvent) => {
        stop(getNoteName(e.note.number));
      },
      { channels: midiChannels.value }
    );
  } else {
    console.log('no midi inputs');
  }
}

onMounted(async () => {
  scrollTo('C4');
  await initMidi();
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
      @mousedown="play(key.replace('s', '#'))"
      @mouseup="stop(key.replace('s', '#'))"
      @mouseout="stop(key.replace('s', '#'))"
    >
      <label> {{ key.replace('s', '#') }}<br /> </label>
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
      box-shadow: -1px 0 0 rgba(255, 255, 255, 0.8) inset, 0 0 5px #ccc inset,
        0 0 3px rgba(0, 0, 0, 0.2);
      background: linear-gradient(to bottom, #eee 0%, #fff 100%);
      &:active,
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
      box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset,
        0 -5px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 2px 4px rgba(0, 0, 0, 0.5);
      background: linear-gradient(45deg, #222 0%, #555 100%);
      &:active,
      &.active {
        box-shadow: -1px -1px 2px rgba(255, 255, 255, 0.2) inset,
          0 -2px 2px 3px rgba(0, 0, 0, 0.6) inset, 0 1px 2px rgba(0, 0, 0, 0.5);
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
