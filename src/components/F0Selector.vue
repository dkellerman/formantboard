<script setup lang="ts">
import { usePlayer } from '../stores/usePlayer';
import { useApp } from '../stores/useApp';

const { f0 } = storeToRefs(useApp());
const player = usePlayer();
const playingF0 = ref<number>();

interface Props {
  defaultVal: string;
}

const props = withDefaults(defineProps<Props>(), { defaultVal: 'A2' });

onMounted(() => {
  f0.value = props.defaultVal;
});

function toggleF0() {
  if (playingF0.value) {
    player.stop(playingF0.value);
    playingF0.value = undefined;
    return;
  }

  const val = f0.value;
  const hz = parseFloat(val);
  const freq = Number.isNaN(hz) ? note2freq(val) : hz;
  if (freq) {
    playingF0.value = freq;
    player?.play(playingF0.value);
  }
}

function restartF0() {
  if (playingF0.value) {
    toggleF0();
    toggleF0();
  }
}

defineExpose({
  toggleF0,
  restartF0,
  player,
});
</script>

<template>
  <v-text-field
    class="f0"
    label="F0"
    v-model="f0"
    :append-inner-icon="!!playingF0 ? 'mdi-stop' : 'mdi-play'"
    density="compact"
    variant="outlined"
    @click:append-inner="toggleF0"
    @change="restartF0"
    @keyup.enter="restartF0"
  />
</template>

<style scoped lang="scss">
.f0 {
  max-width: 100px;
  :deep(.mdi-play::before) {
    color: rgb(16, 116, 16);
  }
  :deep(.mdi-stop::before) {
    color: rgb(163, 11, 11);
  }
}
</style>
