<script setup lang="ts">
import { IPA_WORDS, COMMON_IPA, IPA } from '../stores/useIPA';

interface Props {
  ipaSet?: IPA[];
  title?: string;
}

const props = defineProps<Props>();
const { ipaSet, title } = toRefs(props);

const emit = defineEmits(['change']);
const { ipa } = storeToRefs(useIPA());

const items = computed(() => Object.values(ipaSet?.value ?? COMMON_IPA).map(v => ({
  value: v,
  title: `${v} (${IPA_WORDS[v as IPA]})`,
})));
</script>

<template>
  <section class="ipa-selector">
    <v-select v-model="ipa" :items="items" :label="title ?? 'Sound'" @update:model-value="emit('change', $event)" />
  </section>
</template>

<style scoped>
.ipa-selector {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
