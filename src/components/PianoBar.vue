<script setup lang="ts">
import { FormantSpec } from 'types';
import { computed, ref, onMounted } from 'vue';
import { Note } from 'tonal';

interface Props {
  formantSpecs: FormantSpec[];
  harmonics: [number, number][];
}

const MAXFREQ = 4186;
const props = defineProps<Props>();
const formantSpecs = computed(() => props.formantSpecs?.filter(f => f.on && f.frequency <= MAXFREQ) ?? []);
const harmonics = computed(() => props.harmonics?.filter(([f])=> f <= MAXFREQ) ?? []);
const mounted = ref(false);

function hstyle(h: [number, number]) {
  const x = getXForFrequency(h[0]);
  if (x === null) return 'display: none;';
  return `left: ${x}px`;
}

function fstyle(fs: FormantSpec) {
  const x1 = getXForFrequency(fs.frequency - (fs.frequency * fs.Q));
  const x2 = getXForFrequency(fs.frequency + (fs.frequency * fs.Q));
  if (x1 === null || x2 === null) return 'display: none;';
  return [
    `left: ${x1}px`,
    `width: ${x2 - x1}px`,
  ].join(';');
}

function getXForFrequency(freq: number) {
  const note = Note.fromFreqSharps(freq).replace('#', 's');
  console.log('n', note, document.getElementById(note));
  const rect = document.getElementById(note)?.getBoundingClientRect();
  return rect ? (rect.left + window.scrollX) - 15 : null;
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
        {{ idx < 6 ? `H${idx+1}` : '&nbsp;' }}
        <div class="line">
          |
        </div>
      </li>
      <li
        class="f"
        v-for="fs, idx of formantSpecs"
        :style="fstyle(fs)"
        :key="`F${idx + 1}`"
      >
        F{{ idx + 1 }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.bar {
  height: 60px;
  width: 100%;
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
      &:before { display: none; }

      &.h {
        top: 5px;
        bottom: 0;
        .line {
          margin-top: -3px;
        }
        &.upper {
          color: #aaa;
        }
      }
      &.f {
        top: 42px;
        background: rgb(171, 223, 171);
        padding: 2px;
        font-size: small;
        border: 1px solid forestgreen;
      }
    }
  }
}
</style>
