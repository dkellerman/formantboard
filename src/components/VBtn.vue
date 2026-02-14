<script setup lang="ts">
/* eslint-disable vue/require-default-prop */
import { ToggleContextKey } from './vui-toggle';

interface Props {
  color?: string;
  disabled?: boolean;
  prependIcon?: string;
  type?: 'button' | 'submit' | 'reset';
  value?: unknown;
}

const props = withDefaults(defineProps<Props>(), {
  color: '',
  disabled: false,
  prependIcon: '',
  type: 'button',
});

const emit = defineEmits<{
  (event: 'click', value: MouseEvent): void;
}>();

const toggleContext = inject(ToggleContextKey, null);

const iconText = computed(() => {
  if (props.prependIcon === 'mdi-midi') return '';
  if (props.prependIcon === 'mdi-microphone') return '●';
  if (props.prependIcon === 'mdi-stop') return '■';
  if (props.prependIcon === 'mdi-play') return '▶';
  return '';
});

const selected = computed(() => toggleContext?.isSelected(props.value) ?? false);
const hasColor = computed(() => Boolean(props.color));
const inToggleGroup = computed(() => Boolean(toggleContext));

function onClick(event: MouseEvent) {
  if (props.disabled) return;
  if (toggleContext && props.value !== undefined) toggleContext.toggle(props.value);
  emit('click', event);
}
</script>

<template>
  <button
    :class="[
      'vui-btn',
      'inline-flex h-10 items-center justify-center gap-2 rounded border border-zinc-300',
      'bg-white px-4 text-base leading-none text-zinc-900 shadow-sm transition',
      'hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50',
      inToggleGroup ? 'border-0 bg-zinc-200 hover:bg-zinc-300' : '',
      hasColor ? 'bg-zinc-200' : '',
      selected ? '!bg-white hover:!bg-white' : '',
    ]"
    :disabled="props.disabled"
    :type="props.type"
    v-bind="$attrs"
    @click="onClick"
  >
    <span
      v-if="iconText"
      :class="[
        'text-xs font-semibold uppercase tracking-wide text-zinc-600',
        props.prependIcon === 'mdi-microphone' ? 'text-red-600' : '',
        props.prependIcon === 'mdi-play' ? 'text-[10px] text-emerald-700' : '',
      ]"
    >
      {{ iconText }}
    </span>
    <slot />
  </button>
</template>
