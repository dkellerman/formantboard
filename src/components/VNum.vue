<script setup lang="ts">
interface Props {
  disabled?: boolean;
  label?: string;
  max?: number | string;
  min?: number | string;
  modelValue?: string | number;
  readonly?: boolean;
  step?: number | string;
  suffix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: '',
  max: undefined,
  min: 0,
  modelValue: '',
  readonly: false,
  step: undefined,
  suffix: '',
});

const emit = defineEmits<{
  (event: 'change', value: string | number): void;
  (event: 'update:modelValue', value: string | number): void;
}>();
</script>

<template>
  <VTextField
    class="v-num"
    :disabled="props.disabled"
    :label="props.label"
    :max="props.max"
    :min="props.min"
    :model-value="props.modelValue"
    :readonly="props.readonly"
    :step="props.step"
    :suffix="props.suffix"
    type="number"
    @change="emit('change', $event)"
    @update:modelValue="emit('update:modelValue', $event)"
  />
</template>
