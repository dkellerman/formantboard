export const useKeyboardLayout = defineStore('keyboardLayout', () => {
  const { width: winWidth } = useWindowSize();
  const keyboardWidth = computed(() => winWidth.value * .95);

  const layout = computed<InstanceType<typeof KeyboardLayout>>(() => {
    let bot = 0, top = NOTES.length - 1;
    while (bot < top) {
      const l = new KeyboardLayout(NOTES[bot], NOTES[top]);
      if (top - bot <= 36 || getKeyWidth(l) > 20) return l;
      bot += 1;
      top -= 1;
    }
    return FullKeyboard;
  });
  const fullKeyWidth = computed(() => getKeyWidth(layout.value));

  function getKeyWidth(l: InstanceType<typeof KeyboardLayout>) {
    return keyboardWidth.value / l.whiteKeys.length;
  }

  return { layout, keyboardWidth, fullKeyWidth };
});

