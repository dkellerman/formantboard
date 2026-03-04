import { initTestApp } from "./testApp";
import { resetAppStore } from "@/store";

let testApp = initTestApp();

export function resetStores() {
  testApp.destroy();
  resetAppStore();
  testApp = initTestApp();
}

export function getTestApp() {
  return testApp.getApp();
}
