<script setup lang="ts">
import F0Selector from './F0Selector.vue';

const f0selector = ref<InstanceType<typeof F0Selector>>();
const { ipaSpec } = storeToRefs(useIPA());
const { settings } = storeToRefs(useSettings());
const { visType } = storeToRefs(useVisType());
const formantButtons = ref();

function setFormants() {
  const btns: number[] = [];
  ipaSpec.value.forEach((f, idx) => {
    if (f.on) btns.push(idx);
  });
  formantButtons.value = btns;
}

function updateFormants(btns: unknown) {
  const selected = Array.isArray(btns) ? btns.map((value) => Number(value)) : [];
  ipaSpec.value.forEach((f, idx) => {
    f.on = selected.includes(idx);
  });
  f0selector.value?.restartF0();
}

onMounted(setFormants);
watch([ipaSpec.value], setFormants);
</script>

<template>
  <section
    :class="[
      'mb-5 flex w-full flex-row flex-wrap items-start gap-2 sm:gap-3',
      '[&_.vui-input]:text-sm [&_.vui-select]:text-sm [&_.vui-field-label]:text-[11px]',
      '[&_.vui-field]:min-w-0',
      '[&_.vui-btn]:text-sm',
    ]"
  >
    <F0Selector ref="f0selector" class="w-[140px] sm:w-[150px]" />

    <div class="inline-flex min-w-0 flex-col gap-1">
      <span class="vui-field-label text-xs leading-none text-zinc-500">Formants</span>
      <v-btn-toggle
        class="self-start"
        multiple
        v-model="formantButtons"
        @update:model-value="updateFormants($event)"
      >
        <div v-for="f, idx in ipaSpec" :key="idx" class="group relative inline-flex h-full">
          <v-btn :value="idx">
            F{{ idx + 1 }}
          </v-btn>
          <div
            :class="[
              'pointer-events-none absolute left-1/2 top-full z-[70] mt-1 hidden -translate-x-1/2',
              'whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg',
              'group-hover:block',
            ]"
          >
            <div>Formant F{{ idx + 1 }} [{{ f.on ? 'ON' : 'OFF' }}]</div>
            <div>{{ formantRange(f).join('-') }}hz</div>
          </div>
        </div>
      </v-btn-toggle>
    </div>

    <IPASelector class="w-[200px] max-w-full sm:w-[220px]" @change="f0selector?.restartF0" />

    <v-text-field
      class="w-[136px] max-w-full [&_.vui-suffix]:text-zinc-500"
      label="Tilt"
      v-model="settings.harmonics.tilt"
      @change="f0selector?.restartF0"
      type="number"
      suffix="dB/oct"
      :min="-20.0"
      :max="0.0"
    />

    <v-select
      class="w-[130px] max-w-full"
      v-model="visType"
      :items="VIS_TYPES"
      label="Visualzation"
    />
  </section>
</template>
