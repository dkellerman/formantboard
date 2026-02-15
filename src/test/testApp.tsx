import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useAppContext } from "@/store";
import { useKeyboardLayout } from "@/hooks/useKeyboardLayout";
import { useMidi } from "@/hooks/useMidi";
import { usePlayer } from "@/hooks/usePlayer";

export function initTestApp() {
  let app!: {
    context: ReturnType<typeof useAppContext>;
    keyboardLayout: ReturnType<typeof useKeyboardLayout>;
    midi: ReturnType<typeof useMidi>;
    player: ReturnType<typeof usePlayer>;
  };
  let root: Root;
  const host = document.createElement("div");

  function Probe() {
    app = {
      context: useAppContext(),
      keyboardLayout: useKeyboardLayout(),
      midi: useMidi(),
      player: usePlayer(),
    };
    return null;
  }

  act(() => {
    root = createRoot(host);
    root.render(<Probe />);
  });

  return {
    getApp() {
      return app;
    },
    destroy() {
      act(() => {
        root.unmount();
      });
    },
  };
}
