<script setup lang="ts">
import { Note } from '../utils';

interface Props {
  height?: number;
}
const props = defineProps<Props>();

const { layout, keyboardWidth } = toRefs(useKeyboardLayout());
const metrics = useMetrics();
const noteIds = computed(() => layout.value.notes.map((n: string) => n.replace('#', 's')));
const dragging = ref(false);
const activeNotes = ref<Set<string>>(new Set());
const detectedNotes = ref<Set<string>>(new Set());
const keyboardHeight = computed(() => props.height ?? keyboardWidth.value / 10.0);
const whiteKeyWidth = computed(() => keyboardWidth.value / layout.value.whiteKeys.length);
const blackKeyWidth = computed(() => whiteKeyWidth.value * 0.65);
const blackShadow =
  'shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.2),inset_0_-5px_2px_3px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.5)]';
const blackShadowActive =
  'shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.2),inset_0_-2px_2px_3px_rgba(0,0,0,0.6),0_1px_2px_rgba(0,0,0,0.5)]';
const whiteShadow =
  'shadow-[inset_-1px_0_0_rgba(255,255,255,0.8),inset_0_0_5px_#d4d4d8,0_0_3px_rgba(0,0,0,0.2)]';
const whiteShadowActive =
  'shadow-[inset_2px_0_3px_rgba(0,0,0,0.1),inset_-5px_5px_20px_rgba(0,0,0,0.2),0_0_3px_rgba(0,0,0,0.2)]';

const emit = defineEmits<{
  (e: 'keyOn', note: Note, velocity: number): void;
  (e: 'keyOff', note: Note): void;
}>();

watch(() => metrics.pitch?.note, (newval, oldval) => {
  if (oldval) detectedNotes.value.delete(oldval.replace('#', 's'));
  if (newval) detectedNotes.value.add(newval.replace('#', 's'));
});

function isBlack(id: string) {
  return id.length === 3;
}

function isActive(id: string) {
  return activeNotes.value.has(id);
}

function isDetected(id: string) {
  return detectedNotes.value.has(id);
}

function shouldShowLabel(id: string) {
  return (!isBlack(id) && id[0].toUpperCase() === 'C') || isActive(id) || isDetected(id);
}

function getKeyClass(id: string) {
  const black = isBlack(id);
  const active = isActive(id);
  const detected = isDetected(id);
  if (black) {
    return [
      'group relative z-20 list-none border border-black text-white',
      'rounded-b-sm bg-gradient-to-r from-zinc-800 to-zinc-600',
      blackShadow,
      active
        ? `bg-gradient-to-r from-zinc-600 to-zinc-800 ${blackShadowActive}`
        : '',
      detected ? 'border-sky-700' : '',
    ];
  }

  return [
    'group relative h-full list-none border border-l-zinc-300 border-b-zinc-300 text-black',
    'rounded-b-md bg-gradient-to-b from-zinc-100 to-white',
    whiteShadow,
    active
      ? `border-zinc-400 bg-gradient-to-b from-white to-zinc-200 ${whiteShadowActive}`
      : '',
    detected ? 'border-sky-700' : '',
  ];
}

function getKeyStyle(id: string) {
  if (isBlack(id)) {
    return {
      minWidth: `${blackKeyWidth.value}px`,
      width: `${blackKeyWidth.value}px`,
      height: '57%',
      right: `-${blackKeyWidth.value / 2}px`,
    };
  }

  const letter = id.substring(0, id.length - 1).toUpperCase();
  const overlaps = new Set(['C', 'D', 'F', 'G', 'A']);
  return {
    minWidth: `${whiteKeyWidth.value}px`,
    width: `${whiteKeyWidth.value}px`,
    marginRight: overlaps.has(letter) ? `-${blackKeyWidth.value}px` : undefined,
  };
}

function play(id: string, velocity = 1) {
  emit('keyOn', id.replace('s', '#'), velocity);
  activeNotes.value.add(id);
}

function stop(id: string) {
  emit('keyOff', id.replace('s', '#'));
  activeNotes.value.delete(id);
}

defineExpose({
  play,
  stop,
});
</script>

<template>
  <div class="w-full overflow-hidden border border-zinc-300 border-t-0" @mouseleave="dragging = false">
    <ul
      class="m-0 flex flex-row items-start p-0"
      :style="{ height: `${keyboardHeight}px`, width: `${keyboardWidth}px` }"
    >
      <li
        v-for="id of noteIds" :id="id" :key="id"
        :class="[
          getKeyClass(id),
          'outline-none ring-0 focus:outline-none focus-visible:outline-none',
          'focus:ring-0 focus-visible:ring-0 [-webkit-tap-highlight-color:transparent]',
        ]"
        :style="getKeyStyle(id)"
        tabindex="-1"
        @mousedown.prevent="() => { dragging = true; play(id); }"
        @mouseup="() => { dragging = false; stop(id); }"
        @mouseenter="() => { dragging && play(id) }"
        @mouseout="() => { stop(id); }"
        @touchstart.prevent="() => { dragging = true; play(id); }"
        @touchend="() => { dragging = false; stop(id); }"
      >
        <label
          :class="[
            'pointer-events-none absolute top-[calc(100%-30px)] bg-transparent',
            'px-0.5 text-center text-[10px] text-zinc-400',
            isBlack(id)
              ? 'w-auto border border-zinc-400 bg-white px-1 py-0.5 text-zinc-500'
              : 'w-full',
            shouldShowLabel(id) ? 'block' : 'hidden group-hover:block',
          ]"
        >
          <div>{{ id.replace('s', '#') }}</div>
          <div>{{ note2freq(id.replace('s', '#')).toFixed(0) }}</div>
        </label>
      </li>
    </ul>
  </div>
</template>
