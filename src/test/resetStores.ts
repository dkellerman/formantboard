import { appStore } from "../store";

export function resetAllStores() {
  appStore.getState().resetAll();
}
