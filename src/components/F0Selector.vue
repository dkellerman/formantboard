<script setup lang="ts">
const player = usePlayer();
const { settings } = storeToRefs(useSettings());
const f0 = ref(settings.value.defaultNote);
const playingF0 = ref<number>();

interface Props {
  play?: (freq: number) => void;
  stop?: (freq: number, stopAnalysis?: boolean) => void;
}

const props = defineProps<Props>();
const play = computed(() => props.play ?? player.play);
const stop = computed(() => props.stop ?? player.stop);

function toggleF0() {
  if (playingF0.value) {
    stop.value(playingF0.value, true);
    playingF0.value = undefined;
    return;
  }

  let freq;
  try {
    freq = noteOrFreq2freq(f0.value);
  } catch (e) {
    alert('Invalid note or frequency: "' + f0.value + '". Examples: 440, 27.5, A4, Bb3, or D#5');
    return;
  }

  if (freq) {
    playingF0.value = freq;
    play.value(playingF0.value);
  }
}

function restartF0() {
  if (playingF0.value) {
    toggleF0();
    toggleF0();
  }
}

defineExpose({
  f0,
  toggleF0,
  restartF0,
});
</script>

<template>
  <v-text-field
    class="f0"
    label="F0"
    v-model="f0"
    :append-inner-icon="!!playingF0 ? 'mdi-stop' : 'mdi-play'"
    @click:append-inner="toggleF0"
    @change="restartF0"
    @keyup.enter="restartF0"
    @keyup.up="() => { f0 = String(stepNoteOrFreq(f0, 1, 5)); restartF0(); }"
    @keyup.down="() => { f0 = String(stepNoteOrFreq(f0, -1, -5)); restartF0(); }"
  />
</template>

<style scoped lang="scss">
.f0 {
  max-width: 100px;
  :deep(.mdi-play::before) {
    color: rgb(16, 116, 16);
  }
  :deep(.mdi-stop::before) {
    color: rgb(181, 8, 8);
  }
}
</style>
