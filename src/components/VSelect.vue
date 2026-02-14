<script setup lang="ts">
interface SelectItem {
  title: string;
  value: unknown;
}

interface Props {
  disabled?: boolean;
  items?: Array<SelectItem | string | number>;
  label?: string;
  modelValue?: unknown;
  readonly?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (event: 'change', value: unknown): void;
  (event: 'update:modelValue', value: unknown): void;
}>();

const normalizedItems = computed<SelectItem[]>(() => (props.items ?? []).map((item) => {
  if (typeof item === 'object' && item !== null && 'value' in item) {
    return {
      title: String((item as SelectItem).title),
      value: (item as SelectItem).value,
    };
  }
  return {
    title: String(item),
    value: item,
  };
}));

const selectedIndex = computed(() =>
  normalizedItems.value.findIndex((item) => Object.is(item.value, props.modelValue)),
);

function onChange(event: Event) {
  const index = Number((event.target as HTMLSelectElement).value);
  const selected = normalizedItems.value[index];
  const value = selected?.value;
  emit('update:modelValue', value);
  emit('change', value);
}
</script>

<template>
  <label class="vui-field flex min-w-0 flex-col gap-1 font-sans" v-bind="$attrs">
    <span v-if="props.label" class="vui-field-label text-xs leading-none text-zinc-500">{{ props.label }}</span>
    <span class="relative flex h-11 items-center border border-zinc-300 bg-transparent">
      <select
        :class="[
          'vui-select h-full w-full appearance-none border-0 bg-transparent px-3 pr-10 text-base leading-none',
          'text-zinc-800 outline-none',
        ]"
        :disabled="!!props.disabled || !!props.readonly"
        :value="selectedIndex >= 0 ? String(selectedIndex) : ''"
        @change="onChange"
      >
        <option value="" disabled>Select...</option>
        <option
          v-for="(item, idx) in normalizedItems"
          :key="`${idx}-${item.title}`"
          :value="String(idx)"
        >
          {{ item.title }}
        </option>
      </select>
      <span class="pointer-events-none absolute right-2 text-xs text-zinc-500">▼</span>
    </span>
  </label>
</template>
