<script setup lang="ts">
/* eslint-disable vue/require-default-prop */
/* eslint-disable vue/prop-name-casing */
import PVKnob from 'primevue/knob';

interface Props {
  label?: string;
  modelValue?: number;
  size?: number;
  disabled?: boolean;
  readonly?: boolean;
  step?: number;
  min?: number;
  max?: number;
  valueColor?: string;
  rangeColor?: string;
  textColor?: string;
  strokeWidth?: number;
  showValue?: boolean;
  valueTemplate?: string;
  tabindex?: number;
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

const emit = defineEmits(['update:modelValue', 'change']);

const props = withDefaults(defineProps<Props>(), {
  label: '',
  min: 0,
  max: 1,
  step: .05,
  size: 45,
  showValue: true,
});
</script>

<template>
  <div class="text-center text-sm">
    <label>{{ props.label }}</label>
    <PVKnob
      v-bind="props"
      @update:model-value="emit('update:modelValue', round($event, 2))"
      @change="emit('change', round($event, 2))"
    />
  </div>
</template>
