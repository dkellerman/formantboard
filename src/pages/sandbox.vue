<script setup lang="ts">
/* eslint-disable */
import IPASelector from '../components/IPASelector.vue';
import F0Selector from '../components/F0Selector.vue';
import Visualizer from '../components/Visualizer.vue';
import MidiButton from '../components/MidiButton.vue';
import Keyboard from '../components/Keyboard.vue';
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
const { ipaSpec } = storeToRefs(useIPA());
const { settings } = storeToRefs(useSettings());
const { flutter, harmonics, compression, formants, vibrato, f0 } = settings.value;

const r = () => f0selector.value?.restartF0();

function toggleEffects() {
  compression.on = harmonics.on = flutter.on = vibrato.on = formants.on = allEffects.value;
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
  <section
    :class="[
      'px-5 pb-8 text-xs',
      '[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]',
      '[&_.vui-switch-label]:text-xs [&_.vui-checkbox-label]:text-xs',
    ]"
  >
    <fieldset class="border-0 pb-2">
      <div class="flex items-center gap-3 pr-8">
        <MidiButton :keyboard="keyboard" text="MIDI" />
        <MicButton />
        <div v-if="metrics.pitch" class="ml-5 font-mono text-sm">
          Pitch:
          {{ metrics.pitch.freq.toFixed(1) }}hz
          [{{ metrics.pitch.note }}
          {{ metrics.pitch.cents > 0 ? '+' : ''}}{{ metrics.pitch.cents }}c]
        </div>
      </div>
    </fieldset>

    <div class="mb-6 w-[95vw]">
      <Visualizer :vtype="VisType.POWER" :height="80" combined />
      <Keyboard ref="keyboard" @key-on="player?.play" @key-off="player?.stop" :height="80" />
    </div>

    <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
      <label class="min-w-[170px]">
        <v-switch color="green" label="F0" v-model="f0.on" @change="r" />
      </label>
      <div class="flex flex-wrap gap-3">
        <F0Selector ref="f0selector" class="w-[150px]" />
        <v-num class="w-[150px]" label="Volume" v-model="player.volume" max="100" />
        <v-num class="w-[150px]" label="Key Gain" v-model="f0.keyGain" @change="r" max="1" step=".1" />
        <v-num class="w-[150px]" label="Onset time" v-model="f0.onsetTime" @change="r" suffix="s" step=".01" />
        <v-num class="w-[150px]" label="Decay time" v-model="f0.decayTime" @change="r" suffix="s" step=".01" />
        <v-select class="w-[150px]" label="Source" v-model="f0.source" :items="sources" @update:model-value="r" />
        <v-select class="w-[150px]" label="Source Type" v-model="f0.sourceType" :items="sourceTypes" @update:model-value="r" />
        <v-num class="w-[150px]" label="Latency" v-model="metrics.latency" readonly suffix="s" />
        <v-num class="w-[150px] font-mono" label="RMS Vol" v-model="metrics.rms" readonly suffix="dB" />
      </div>
    </fieldset>
    <fieldset class="border-0 p-0"><v-switch color="green" label="All effects" v-model="allEffects" @change="toggleEffects" /></fieldset>
    <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
      <label class="min-w-[170px]"><v-switch color="green" label="Harmonics" v-model="harmonics.on" @change="r" /></label>
      <div class="flex flex-wrap gap-3">
        <v-num class="w-[150px]" label="Max num" v-model="harmonics.max" @change="r" />
        <v-num class="w-[150px]" label="Max freq" v-model="harmonics.maxFreq" @change="r" suffix="hz" step="50" />
        <v-num class="w-[150px] [&_.vui-suffix]:text-zinc-500" label="Tilt" v-model="harmonics.tilt" @change="r" min="-40" max="12" suffix="dB/oct" step=".5" />
        <v-num class="w-[150px]" label="Actual" v-model="metrics.harmonics.length" readonly></v-num>
        <div class="flex h-11 items-center pt-4">
          <v-checkbox label="Show gains" v-model="showHGains" />
        </div>
        <div v-show="showHGains" class="basis-full overflow-auto bg-white pb-3 font-mono text-xs">
          <span v-for="([h, g], idx) of metrics.harmonics.slice(0, 40)" :key="idx">
            [H{{ idx+1 }}={{ g.toFixed(2) }}]&nbsp;
            <br v-if="idx > 0 && idx % 6 === 0" />
          </span>
        </div>
      </div>
    </fieldset>
    <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
      <label class="min-w-[170px]"><v-switch color="green" label="Flutter" v-model="flutter.on" @change="r" /></label>
      <div class="flex flex-wrap gap-3">
        <v-num class="w-[150px]" label="Amount" v-model="flutter.amount" @change="r" step=".5" />
      </div>
    </fieldset>
    <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
      <label class="min-w-[170px]"><v-switch color="green" label="Vibrato" v-model="vibrato.on" @change="r" /></label>
      <div class="flex flex-wrap gap-3">
        <v-num class="w-[150px]" label="Rate" v-model="vibrato.rate" @change="r" suffix="hz" step=".5" />
        <v-num class="w-[150px]" label="Extent" v-model="vibrato.extent" @change="r" suffix="hz" step=".5" />
        <v-num class="w-[150px]" label="Jitter" v-model="vibrato.jitter" @change="r" step=".5" />
        <v-num class="w-[150px]" label="Onset time" v-model="vibrato.onsetTime" @change="r" suffix="s" step=".1" />
      </div>
    </fieldset>
    <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
      <label class="min-w-[170px]"><v-switch color="green" label="Formants" v-model="formants.on" @change="r" /></label>
      <div class="flex flex-wrap gap-3">
        <IPASelector class="w-[200px]" @change="r" :ipa-set="ALL_IPA" />
        <IPASelector class="w-[200px]" @change="r" :ipa-set="COMMON_IPA" title="Common" />
        <IPASelector class="w-[200px]" @change="r" :ipa-set="VOWELS" title="Vowels" />
        <IPASelector class="w-[200px]" @change="r" :ipa-set="CONSONANTS" title="Consonants" />
        <IPASelector class="w-[200px]" @change="r" :ipa-set="FRICATIVES" title="Fricatives" />
      </div>
    </fieldset>
    <div v-for="formant, idx in ipaSpec">
      <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
        <label class="min-w-[170px]"><v-switch color="green" :label="`F${idx+1}`" v-model="formant.on" @change="r" /></label>
        <div class="flex flex-wrap gap-3">
          <v-num class="w-[150px]" label="Freq" v-model="formant.frequency" @change="r" suffix="hz" step="50" />
          <v-num class="w-[150px]" label="Q" v-model="formant.Q" @change="r" max="1" step=".01" />
          <v-num class="w-[150px]" label="Gain" v-model="formant.gain" @change="r" step=".1" />
        </div>
      </fieldset>
    </div>
    <fieldset class="mb-2 flex flex-row items-start border-0 border-b border-dotted border-zinc-300 py-3">
      <label class="min-w-[170px]"><v-switch color="green" label="Compression" v-model="compression.on" @change="r" /></label>
      <div class="flex flex-wrap gap-3">
        <v-num class="w-[150px]" label="Treshold" v-model="compression.threshold" @change="r" />
        <v-num class="w-[150px]" label="Knee" v-model="compression.knee" @change="r" />
        <v-num class="w-[150px]" label="Ratio" v-model="compression.ratio" @change="r" />
        <v-num class="w-[150px]" label="Attack" v-model="compression.attack" @change="r" />
        <v-num class="w-[150px]" label="Release" v-model="compression.release" @change="r" />
        <v-num class="w-[150px]" label="Reduction" v-model="metrics.compression" readonly suffix="dB"></v-num>
        <meter class="mt-2" max="20" optimum="0" low="0" high="1" :value="Math.abs(metrics.compression)" />
      </div>
    </fieldset>
</section>
</template>
