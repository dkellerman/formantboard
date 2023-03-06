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

async function enableMic() {
  const ctx = player.analyzer.context as AudioContext;
  mic.value = await createMicSource(ctx);
  mic.value.connect(player.analyzer);
}

function disableMic() {
  mic.value?.disconnect();
  mic.value = undefined;
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
