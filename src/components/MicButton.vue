<script setup lang="ts">
interface Props {
  showButton?: boolean;
  startText?: string;
  stopText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showButton: true,
  startText: 'Listen',
  stopText: 'Stop',
});

const player = usePlayer();
const mic = ref<MediaStreamAudioSourceNode>();
const metrics = useMetrics();
const { settings } = storeToRefs(useSettings());
const listening = ref(false);
const micRafId = ref<number>();

async function enableMic() {
  const ctx = player.analyzer.context as AudioContext;
  if (player.rafId) {
    player.output.disconnect(player.analyzer);
  } else {
    micRafId.value = requestAnimationFrame(player.analyze);
  }
  mic.value = await createMicSource(ctx);
  mic.value.connect(player.analyzer);

  const pitchDetection = await createPitchDetectionNode(ctx, (freq: number) => {
    const [note, cents] = freq2noteCents(freq);
    metrics.source = 'mic';
    metrics.pitch = { freq, note, cents };
    const hcfg = settings.value.harmonics;
    metrics.harmonics = getHarmonics(freq, hcfg.tilt, hcfg.max, hcfg.maxFreq).map(([f, g]) => [f, g, 0.0]);
  });

  mic.value.connect(pitchDetection);
  listening.value = true;
}

function disableMic() {
  if (micRafId.value) cancelAnimationFrame(micRafId.value);
  micRafId.value = undefined;
  mic.value?.disconnect();
  mic.value = undefined;
  if (player.rafId) player.output.connect(player.analyzer);
  listening.value = false;
}

onUnmounted(() => {
  disableMic();
});

defineExpose({
  enableMic,
  mic,
  listening,
});
</script>

<template>
  <section class="mic">
    <v-btn
      v-if="props.showButton"
      :prepend-icon="mic ? 'mdi-stop' : 'mdi-microphone'"
      @click="!mic ? enableMic() : disableMic()"
    >
      {{ mic ? props.stopText : props.startText }}
    </v-btn>
  </section>
</template>

<style scoped lang="scss">
:deep(.mdi-microphone), :deep(.mdi-stop) {
  color: red;
}
</style>
