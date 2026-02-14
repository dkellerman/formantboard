<script setup lang="ts">
import { ToggleContextKey } from './vui-toggle';

interface Props {
  modelValue?: unknown[] | unknown;
  multiple?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: unknown[] | unknown): void;
}>();

const selectedValues = computed(() => {
  if (!props.multiple) return [];
  return Array.isArray(props.modelValue) ? props.modelValue : [];
});

function isSelected(value: unknown) {
  if (props.multiple) return selectedValues.value.some((selected) => Object.is(selected, value));
  return Object.is(props.modelValue, value);
}

function toggle(value: unknown) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const idx = current.findIndex((selected) => Object.is(selected, value));
    if (idx === -1) current.push(value);
    else current.splice(idx, 1);
    emit('update:modelValue', current);
    return;
  }
  emit('update:modelValue', value);
}

provide(ToggleContextKey, {
  isSelected,
  toggle,
});
</script>

<template>
  <div
    :class="[
      'inline-flex h-11 w-fit rounded border border-zinc-300 bg-zinc-200',
      '[&>*]:h-full',
      '[&>*>button]:h-full [&>*>button]:rounded-none [&>*>button]:border-0',
      '[&>*>button]:border-l [&>*>button]:border-l-zinc-300 [&>*:first-child>button]:border-l-0',
      '[&>*>button]:text-base [&>*>button]:leading-none [&>*>button]:shadow-none',
    ]"
    role="group"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
