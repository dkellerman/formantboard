import { initTestApp } from "./testApp";
import { resetAppStore } from "@/store";

let testApp = initTestApp();

export function resetAllStores() {
  testApp.destroy();
  resetAppStore();
  testApp = initTestApp();
}

export function getTestApp() {
  return testApp.getApp();
}
