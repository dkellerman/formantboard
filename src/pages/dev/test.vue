<script setup lang="ts">
interface Props {
}

const emits = defineEmits<{
  (e: 'click'): void;
}>();

const props = withDefaults(defineProps<Props>(), {});
</script>

<template>
  <section class="foo">
  </section>
</template>

<style lang="scss" scoped>
section {
}
</style>
