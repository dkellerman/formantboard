<script setup lang="ts">
interface Props {
  appendInnerIcon?: string;
  disabled?: boolean;
  label?: string;
  max?: number | string;
  min?: number | string;
  modelValue?: string | number;
  readonly?: boolean;
  step?: number | string;
  suffix?: string;
  type?: string;
}

const props = withDefaults(defineProps<Props>(), {
  appendInnerIcon: '',
  disabled: false,
  label: '',
  max: undefined,
  min: undefined,
  modelValue: '',
  readonly: false,
  step: undefined,
  suffix: '',
  type: 'text',
});

const emit = defineEmits<{
  (event: 'change', value: string | number): void;
  (event: 'click:append-inner'): void;
  (event: 'keyup', value: KeyboardEvent): void;
  (event: 'update:modelValue', value: string | number): void;
}>();

const inputValue = computed(() => props.modelValue ?? '');
const appendText = computed(() => {
  if (props.appendInnerIcon === 'mdi-play') return '▶';
  if (props.appendInnerIcon === 'mdi-stop') return '■';
  return props.appendInnerIcon;
});

function normalizeValue(raw: string): string | number {
  if (props.type !== 'number') return raw;
  if (raw === '') return raw;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? raw : parsed;
}

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  emit('update:modelValue', normalizeValue(raw));
}

function onChange(event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  emit('change', normalizeValue(raw));
}

function onKeyup(event: KeyboardEvent) {
  emit('keyup', event);
}
</script>

<template>
  <label class="vui-field flex min-w-0 flex-col gap-1 font-sans" v-bind="$attrs">
    <span v-if="props.label" class="vui-field-label text-xs leading-none text-zinc-500">
      {{ props.label }}
    </span>
    <span class="vui-control-wrap flex h-11 items-center border border-zinc-300 bg-transparent">
      <input
        :class="[
          'vui-input h-full min-w-0 flex-1 border-0 bg-transparent px-4 text-base leading-none',
          'text-zinc-900 outline-none',
        ]"
        :disabled="props.disabled"
        :max="props.max"
        :min="props.min"
        :readonly="props.readonly"
        :step="props.step"
        :type="props.type"
        :value="inputValue"
        @change="onChange"
        @input="onInput"
        @keyup="onKeyup"
      >
      <button
        v-if="props.appendInnerIcon"
        :class="[
          'vui-append-btn inline-flex h-full min-w-[42px] items-center justify-center',
          'bg-transparent px-2 text-sm transition hover:bg-zinc-100',
          !['mdi-play', 'mdi-stop'].includes(props.appendInnerIcon) ? 'text-zinc-600' : '',
          props.appendInnerIcon === 'mdi-play' ? 'text-xl leading-none text-green-700' : '',
          props.appendInnerIcon === 'mdi-stop' ? 'text-lg leading-none text-red-600' : '',
        ]"
        type="button"
        @click="emit('click:append-inner')"
      >
        {{ appendText }}
      </button>
      <span
        v-if="props.suffix"
        class="vui-suffix inline-flex h-full items-center px-3 text-sm leading-none text-zinc-700"
      >
        {{ props.suffix }}
      </span>
    </span>
  </label>
</template>
