export enum VisType {
  POWER,
  WAVE,
}

export const VIS_TYPES = [
  { title: 'Spectrum', value: VisType.POWER },
  { title: 'Wave', value: VisType.WAVE },
];

export const useVisType = defineStore('visType', () => {
  const { settings } = storeToRefs(useSettings());
  const visType = ref<VisType>(settings.value.defaultVisType);
  return { visType };
});
