import { ref } from 'vue';
import { defineStore } from 'pinia';

export type Settings = {
  foo: string;
};

const defaultSettings: Settings = {
  foo: 'bar',
};

export const useSettings = defineStore('settings', () => {
  const settings = ref<Settings>({
    ...defaultSettings,
  });

  // from URL
  // from local storage
  // from defaults

  return { settings };
});
