<script setup lang="ts">
/* eslint-disable */
import VowelSelector from '../components/VowelSelector.vue';
import F0Selector from '../components/F0Selector.vue';
import Visualizer from '../components/Visualizer.vue';
import MidiButton from '../components/MidiButton.vue';
import Keyboard from '../components/Keyboard.vue';
import PianoBar from '../components/PianoBar.vue';
import MicButton from '../components/MicButton.vue';

const sources = [
  { title: 'Tone', value: 'osc' },
  { title: 'Noise', value: 'noise' },
];

const sourceTypes = computed(() => f0.source === 'osc' ? [
  { title: 'Sine', value: 'sine' },
  { title: 'Sawtooth', value: 'sawtooth' },
  { title: 'Square', value: 'square' },
] : []);

const f0selector = ref<InstanceType<typeof F0Selector>>();
const allEffects = ref(true);
const metrics = useMetrics();
const player = usePlayer();
const showHGains = ref(false);
const keyboard = ref<InstanceType<typeof Keyboard>>();
const { vowelSpec } = storeToRefs(useVowel());
const { settings } = storeToRefs(useSettings());
const { flutter, harmonics, compression, formants, tube, vibrato, f0, preemphasis } = settings.value;

const r = () => f0selector.value?.restartF0();

function toggleEffects() {
  compression.on = harmonics.on = flutter.on = vibrato.on = tube.on = formants.on =
    preemphasis.on = allEffects.value;
  f0selector.value?.restartF0();
}

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      f0selector.value?.toggleF0();
    }
  });
});
</script>

<template>
  <section class="sandbox">
    <fieldset class="actions">
      <div>
        <MidiButton :keyboard="keyboard" text="MIDI" />
        <MicButton />
        <div v-if="metrics.pitch" style="margin-left: 20px; font-family: monospace">
          Pitch:
          {{ metrics.pitch.freq.toFixed(1) }}hz
          [{{ metrics.pitch.note }}
          {{ metrics.pitch.cents > 0 ? '+' : ''}}{{ metrics.pitch.cents }}c]
        </div>
      </div>
    </fieldset>

    <Visualizer :vtype="VisType.POWER" :height="80" combined />
    <PianoBar :height="80" :harmonics="metrics.harmonics" :vowel-spec="vowelSpec" />
    <Keyboard ref="keyboard" @key-on="player?.play" @key-off="player?.stop" :height="80" />

    <fieldset>
      <label>
        <v-switch label="F0" v-model="f0.on" @change="r" />
        <v-switch label="All effects" v-model="allEffects" @change="toggleEffects" />
      </label>
      <div>
        <F0Selector ref="f0selector" />
        <v-num label="Volume" v-model="player.volume" max="100" />
        <v-num label="Key Gain" v-model="f0.keyGain" @change="r" max="1" step=".1" />
        <v-num label="Onset time" v-model="f0.onsetTime" @change="r" suffix="s" step=".01" />
        <v-num label="Decay time" v-model="f0.decayTime" @change="r" suffix="s" step=".01" />
        <v-select label="Source" v-model="f0.source" :items="sources" @update:model-value="r" />
        <v-select label="Source Type" v-model="f0.sourceType" :items="sourceTypes" @update:model-value="r" />
        <v-num label="Latency" v-model="metrics.latency" readonly suffix="s" />
        <v-num label="RMS Vol" v-model="metrics.rms" readonly suffix="dB" />
      </div>
    </fieldset>
    <fieldset>
      <label><v-switch label="Harmonics" v-model="harmonics.on" @change="r" /></label>
      <div>
        <v-num label="Max num" v-model="harmonics.max" @change="r" />
        <v-num label="Max freq" v-model="harmonics.maxFreq" @change="r" suffix="hz" step="50" />
        <v-num label="Tilt" v-model="harmonics.tilt" @change="r" min="-40" max="12" suffix="dB/oct" step=".5" />
        <v-num label="Actual" v-model="metrics.harmonics.length" readonly></v-num>
        <v-checkbox label="Show gains" v-model="showHGains" />
        <div v-show="showHGains" class="hgains">
          <span v-for="([h, g], idx) of metrics.harmonics.slice(0, 40)" :key="idx">
            [H{{ idx+1 }}={{ g.toFixed(2) }}]&nbsp;
            <br v-if="idx > 0 && idx % 6 === 0" />
          </span>
        </div>
      </div>
    </fieldset>
    <fieldset>
      <label><v-switch label="Pre-emphasis" v-model="preemphasis.on" @change="r" /></label>
      <div>
        <v-num label="Frequency" v-model="preemphasis.frequency" @change="r" step="100" />
        <v-num label="Q" v-model="preemphasis.Q" @change="r" step=".1" />
        <v-num label="Gain" v-model="preemphasis.gain" @change="r" />
      </div>
    </fieldset>
    <fieldset>
      <label><v-switch label="Flutter" v-model="flutter.on" @change="r" /></label>
      <div>
        <v-num label="Amount" v-model="flutter.amount" @change="r" step=".5" />
      </div>
    </fieldset>
    <fieldset>
      <label><v-switch label="Vibrato" v-model="vibrato.on" @change="r" /></label>
      <div>
        <v-num label="Rate" v-model="vibrato.rate" @change="r" suffix="hz" step=".5" />
        <v-num label="Extent" v-model="vibrato.extent" @change="r" suffix="hz" step=".5" />
        <v-num label="Jitter" v-model="vibrato.jitter" @change="r" step=".5" />
        <v-num label="Onset time" v-model="vibrato.onsetTime" @change="r" suffix="s" step=".1" />
      </div>
    </fieldset>
    <fieldset>
      <label><v-switch label="Tube" v-model="tube.on" @change="r" /></label>
    </fieldset>
    <fieldset>
      <label><v-switch label="Formants" v-model="formants.on" @change="r" /></label>
      <div>
        <VowelSelector />
      </div>
    </fieldset>
    <div v-for="formant, idx in vowelSpec">
      <fieldset>
        <label><v-switch :label="`F${idx+1}`" v-model="formant.on" @change="r" /></label>
        <div>
          <v-num label="Freq" v-model="formant.frequency" @change="r" suffix="hz" step="50" />
          <v-num label="Q" v-model="formant.Q" @change="r" max="1" step=".01" />
          <v-num label="Gain" v-model="formant.gain" @change="r" step=".1" />
        </div>
      </fieldset>
    </div>
    <fieldset>
      <label><v-switch label="Compression" v-model="compression.on" @change="r" /></label>
      <div>
        <v-num label="Treshold" v-model="compression.threshold" @change="r" />
        <v-num label="Knee" v-model="compression.knee" @change="r" />
        <v-num label="Ratio" v-model="compression.ratio" @change="r" />
        <v-num label="Attack" v-model="compression.attack" @change="r" />
        <v-num label="Release" v-model="compression.release" @change="r" />
        <v-num label="Reduction" v-model="metrics.compression" readonly suffix="dB"></v-num>
        <meter max="20" optimum="0" low="0" high="1" :value="Math.abs(metrics.compression)" />
      </div>
    </fieldset>
</section>
</template>

<style scoped lang="scss">
section.sandbox {
  padding: 10px 20px;
  .visualizer, .bar {
    margin-top: 0px;
  }
  .keyboard {
    margin-top: -20px;
  }
  fieldset.actions {
    border: 0;
    gap: 10px;
    padding-right: 30px;
  }
  fieldset {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    padding: 0px;
    margin-bottom: 10px;
    border: 0;
    border-bottom: 1px dotted #ccc;
    padding-top: 10px;

    & > label {
      align-self: flex-start;
      min-width: 170px;
      flex: unset;
    }
    & > div {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      .v-text-field, .v-switch, .vowel-selector, .v-checkbox {
        width: 150px;
        flex: unset;
      }
      .vowel-selector {
        width: 200px;
      }
      .hgains {
        padding-bottom: 10px;
        overflow: scroll;
        background: #eee;
        width: 80vw;
      }
    }
  }
  meter {
    margin-top: 10px;
  }

  .bar {
    display: none;
  }

  [readonly] {
    font-family: monospace;
  }
}
</style>
