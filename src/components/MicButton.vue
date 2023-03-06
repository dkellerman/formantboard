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
}

function disableMic() {
  if (micRafId.value) cancelAnimationFrame(micRafId.value);
  micRafId.value = undefined;
  mic.value?.disconnect();
  mic.value = undefined;
  if (player.rafId) player.output.connect(player.analyzer);
}

onUnmounted(() => {
  disableMic();
});

defineExpose({
  enableMic,
  mic,
});
</script>

<template>
  <section class="mic">
    <v-btn
      v-if="props.showButton"
      :prepend-icon="mic ? 'mdi-stop' : 'mdi-record'"
      @click="!mic ? enableMic() : disableMic()"
    >
      {{ mic ? props.stopText : props.startText }}
    </v-btn>
  </section>
</template>
