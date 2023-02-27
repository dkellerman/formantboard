<script setup lang="ts">
import type { FormantSpec } from '../stores/useSettings';
import { freq2px } from '../utils';

interface Props {
  formantSpec: FormantSpec;
  harmonics: [number, number][];
  width?: number;
}

const MAXFREQ = 4186;
const props = defineProps<Props>();
const formantSpecs = computed(() => props.formantSpec?.filter(f => f.frequency <= MAXFREQ) ?? []);
const harmonics = computed(() => props.harmonics?.filter(([f])=> f <= MAXFREQ) ?? []);
const mounted = ref(false);
const width = computed(() => props.width ?? document.querySelector('.keyboard')?.scrollWidth ?? 300);

function hstyle(h: [number, number]) {
  const x = freq2px(h[0], width.value);
  if (x === null) return 'display: none;';
  return `left: ${x}px`;
}

function fstyle(fs: FormantSpec[number]) {
  const bandwidth = fs.frequency * fs.Q;
  const x1 = freq2px(fs.frequency - (bandwidth / 2), width.value);
  const x2 = freq2px(fs.frequency + (bandwidth / 2), width.value);
  if (x1 === null || x2 === null) return 'display: none;';
  return [
    `left: ${x1}px`,
    `width: ${x2 - x1}px`
  ].join(';');
}

onMounted(() => mounted.value = true);
</script>

<template>
  <div class="bar">
    <ul v-if="mounted">
      <li
        :class="`h ${idx >= 6 ? 'upper' : 'lower'}`"
        v-for="h, idx of harmonics"
        :style="hstyle(h)"
        :key="`H${idx + 1}`"
      >
        <!-- {{ idx < 6 ? `H${idx+1}` : '&nbsp;' }} -->&nbsp;
        <div class="line">
          |
        </div>
        <v-tooltip
          activator="parent"
          location="left"
          :open-on-hover="true"
        >
          <div>Harmonic H{{ idx + 1 }}</div>
          <div>Frequency: {{ h[0].toFixed(2) }}</div>
          <div>Gain: {{ h[1].toFixed(2) }}</div>
        </v-tooltip>
      </li>

      <li
        v-for="fs, idx of formantSpecs"
        :class="`f ${fs.on ? 'on' : 'off'}`"
        :style="fstyle(fs)"
        :key="`F${idx + 1}`"
      >
        <!-- F{{ idx + 1 }} -->&nbsp;
        <v-tooltip
          activator="parent"
          location="top"
          :open-on-hover="true"
        >
          <div>Formant F{{ idx + 1 }} [{{ fs.on ? 'ON' : 'OFF' }}]</div>
          <div>
            {{ fs.frequency - (fs.frequency * fs.Q) }}-{{ fs.frequency + (fs.frequency * fs.Q) }}hz
          </div>
        </v-tooltip>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.bar {
  height: 80px;
  width: calc(1px * v-bind(width));
  border-bottom: 0;
  box-shadow: 2px 0 3px rgba(0, 0, 0, 0.1) inset, -5px 5px 20px rgba(0, 0, 0, 0.2) inset;
  border-radius: 7px 7px 0 0;
  ul {
    padding: 0;
    margin: 0;
    position: relative;
    li {
      position: absolute;
      text-indent: 0;
      font-size: medium;
      text-align: center;
      list-style: none;

      &.h {
        top: 10px;
        bottom: 0;
        .line {
          margin-top: -3px;
        }
        &.upper {
          color: #aaa;
        }
      }
      &.f {
        top: 55px;
        background: linear-gradient(to right, rgb(171, 223, 171), rgb(179, 222, 179));
        padding: 2px;
        font-size: small;
        &.off {
          background: rgb(223, 171, 171);
          border: 1px solid darkred;
        }
      }
    }
  }
}
</style>
