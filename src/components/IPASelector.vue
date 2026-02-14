<script setup lang="ts">
import { IPA_WORDS, COMMON_IPA, type IPAType } from '../stores/useIPA';

interface Props {
  ipaSet?: IPAType[];
  title?: string;
}

const props = defineProps<Props>();
const { ipaSet, title } = toRefs(props);

const emit = defineEmits(['change']);
const { ipa } = storeToRefs(useIPA());

const items = computed(() => Object.values(ipaSet?.value ?? COMMON_IPA).map(v => ({
  value: v,
  title: `${v} (${IPA_WORDS[v as IPAType]})`,
})));
</script>

<template>
  <section class="flex flex-row items-center">
    <v-select
      class="w-full"
      v-model="ipa"
      :items="items"
      :label="title ?? 'Sound'"
      @update:model-value="emit('change', $event)"
    />
  </section>
</template>
