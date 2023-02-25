<script setup lang="ts">
const piano = ref<HTMLElement>();
const noteIds = computed(() => NOTES.map((n) => n.replace('#', 's')));
const dragging = ref(false);
const { width } = useWindowSize();

const emit = defineEmits<{
  (e: 'play', freq: number, velocity: number): void;
  (e: 'stop', freq: number): void;
}>();

function getKeyById(id: string) {
  return document.getElementById(id.replace('#', 's'));
}

function activateKey(id: string) {
  const k = getKeyById(id);
  if (k) {
    k.classList.add('active');
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (k as any).scrollIntoViewIfNeeded?.(false);
  }
}

function deactivateKey(id: string) {
  getKeyById(id)?.classList.remove('active');
}

function scrollToKey(id: string, behavior: 'auto' | 'smooth' = 'auto') {
  getKeyById(id)?.scrollIntoView({ behavior, inline: 'center' });
}

function getKeyClass(id: string) {
  return `key ${id.substring(0, id.length - 1).toUpperCase()} ${id.length === 3 ? 'black' : 'white'}`;
}

function play(id: string, velocity = 1) {
  emit('play', freq(id.replace('s', '#')), velocity);
  activateKey(id);
}

function stop(id: string) {
  emit('stop', freq(id.replace('s', '#')));
  deactivateKey(id);
}

onMounted(async () => {
  // TODO: kb keys
  scrollToKey('C4');
});

defineExpose({
  play,
  stop,
  width,
});
</script>

<template>
  <div class="piano">
    <ul class="keys" ref="piano">
      <li
        v-for="id of noteIds" :id="id" :key="id"
        :class="getKeyClass(id)"
        @mousedown.prevent="() => { dragging = true; play(id); }"
        @mouseup.prevent="() => { dragging = false; stop(id); }"
        @mouseenter.prevent="() => { dragging && play(id) }"
        @mouseout.prevent="() => stop(id)"
      >
        <label>
          <div>{{ id.replace('s', '#') }}</div>
          <div>{{ freq(id.replace('s', '#')).toFixed(0) }}</div>
        </label>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
$whiteKeyWidth: calc((v-bind(width) / 52) * 1px);
$kbdHeight: calc((v-bind(width) / 52) * 5px);
$blackKeyWidth: calc((v-bind(width) / 52) * .65px);
$blackKeyHeight: 57%;

.piano {
  width: 100%;
  min-width: 800px;
  overflow: auto;
}

ul {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  height: $kbdHeight;
  padding: 0;
  margin: 0;

  li {
    text-indent: 0;
    list-style: none;
    height: 100%;
    border: 1px solid #000;
    position: relative;

    &.white {
      min-width: $whiteKeyWidth;
      height: 100%;
      color: #000;
      position: relative;
      &.C, &.D, &.F, &.G, &.A {
        margin-right: calc(-1 * $blackKeyWidth);
      }

      border-left: 1px solid #bbb;
      border-bottom: 1px solid #bbb;
      border-radius: 0 0 5px 5px;
      box-shadow:
        -1px 0 0 rgba(255, 255, 255, 0.8) inset,
        0 0 5px #ccc inset,
        0 0 3px rgba(0, 0, 0, 0.2);
      background: linear-gradient(to bottom, #eee 0%, #fff 100%);

      &.active {
        border-top: 1px solid #777;
        border-left: 1px solid #999;
        border-bottom: 1px solid #999;
        box-shadow:
          2px 0 3px rgba(0, 0, 0, 0.1) inset,
          -5px 5px 20px rgba(0, 0, 0, 0.2) inset,
          0 0 3px rgba(0, 0, 0, 0.2);
        background: linear-gradient(to bottom, #fff 0%, #e9e9e9 100%);
      }
    }

    &.black {
      min-width: $blackKeyWidth;
      height: $blackKeyHeight;
      color: #fff;
      position: relative;
      right: calc((-1 * $blackKeyWidth) / 2);
      z-index: 2;

      border: 1px solid #000;
      border-radius: 0 0 3px 3px;
      box-shadow:
        -1px -1px 2px rgba(255, 255, 255, 0.2) inset,
        0 -5px 2px 3px rgba(0, 0, 0, 0.6) inset,
        0 2px 4px rgba(0, 0, 0, 0.5);
      background: linear-gradient(45deg, #222 0%, #555 100%);
      &.active {
        box-shadow:
          -1px -1px 2px rgba(255, 255, 255, 0.2)
          inset, 0 -2px 2px 3px rgba(0, 0, 0, 0.6) inset,
          0 1px 2px rgba(0, 0, 0, 0.5);
        background: linear-gradient(to right, #555 0%, #222 100%);
      }
    }

    label {
      position: absolute;
      color: #999;
      background: transparent;
      font-size: 10px;
      margin-right: calc(-1 * $blackKeyWidth / 2);
      top: calc(100% - 30px);
      width: 100%;
      text-align: center;
      padding: 0 2px;
      display: none;
    }
    &.black label {
      width: unset;
      background: white;
      padding: 3px;
      border: 1px solid #aaa;
    }
    &.C label, &.white:hover label {
      display: initial;
    }
  }
}
</style>
