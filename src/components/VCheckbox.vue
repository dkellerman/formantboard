<script setup lang="ts">
interface Props {
  disabled?: boolean;
  label?: string;
  modelValue?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: '',
  modelValue: false,
  readonly: false,
});

const emit = defineEmits<{
  (event: 'change', value: boolean): void;
  (event: 'update:modelValue', value: boolean): void;
}>();

function onChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  emit('update:modelValue', checked);
  emit('change', checked);
}
</script>

<template>
  <label class="inline-flex h-11 items-center gap-2" v-bind="$attrs">
    <input
      class="h-5 w-5 rounded border-zinc-400 text-zinc-700 focus:ring-zinc-500"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled || props.readonly"
      @change="onChange"
    >
    <span class="vui-checkbox-label text-sm leading-none text-zinc-900">{{ props.label }}</span>
  </label>
</template>
