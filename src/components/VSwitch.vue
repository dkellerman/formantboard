<script setup lang="ts">
interface Props {
  color?: 'emerald' | 'green';
  disabled?: boolean;
  label?: string;
  modelValue?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  color: 'emerald',
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

const trackOnClass = computed(() => (
  props.color === 'green' ? 'peer-checked:bg-green-400' : 'peer-checked:bg-emerald-400'
));

const thumbOnClass = computed(() => (
  props.color === 'green' ? 'bg-green-600' : 'bg-emerald-700'
));
</script>

<template>
  <label class="vui-switch inline-flex h-11 items-center gap-3" v-bind="$attrs">
    <input
      class="peer sr-only"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled || props.readonly"
      @change="onChange"
    >
    <span
      :class="[
        'relative inline-flex h-5 w-11 items-center rounded-full bg-zinc-400 transition',
        trackOnClass,
      ]"
    >
      <span
        class="inline-block h-6 w-6 rounded-full bg-zinc-700 shadow transition"
        :class="[
          props.modelValue ? thumbOnClass : '',
          props.modelValue ? 'translate-x-5' : '-translate-x-0.5',
        ]"
      />
    </span>
    <span class="vui-switch-label text-sm leading-none text-zinc-900">{{ props.label }}</span>
  </label>
</template>
