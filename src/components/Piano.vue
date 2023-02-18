<script setup lang="ts">

const KEYS: string[] = [];
for (let o = 0; o < 8; o++) {
  for (const key of ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#']) {
    KEYS.push(`${key}${o}`);
  }
}

</script>

<template>
  <ul class="keys">
    <li v-for="(key, idx) of KEYS" :id="key" :key="key" :class="`key ${key.substring(0, key.length - 1)} ${key.includes('#') ? 'black' : 'white'}`">
      <label>{{ key }}</label>
    </li>
  </ul>
</template>

<style scoped lang="scss">
ul {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  height: 160px;
  width: 90vw;
  overflow: scroll;

  li {
    text-indent: 0;
    &:before {
      display: none;
    }
    height: 100%;
    border: 1px solid #000;
    font-size: small;
    position: relative;
    label {
      text-align: center;
      height: 100%;
      width: 100%;
      position: relative;
      color: #aaa;
    }
    &.black label {
      top: 60px;
      left: calc(50% - 11px);
    }
    &.white label {
      top: 130px;
      left: calc(50% - 7px);
    }

    &.white {
      min-width: 50px;
      color: #000;
      border-left: 1px solid #bbb;
      border-bottom: 1px solid #bbb;
      border-radius: 0 0 5px 5px;
      box-shadow: -1px 0 0 rgba(255,255,255,0.8) inset,0 0 5px #ccc inset,0 0 3px rgba(0,0,0,0.2);
      background: linear-gradient(to bottom,#eee 0%,#fff 100%);
      &:active {
        border-top: 1px solid #777;
        border-left: 1px solid #999;
        border-bottom: 1px solid #999;
        box-shadow: 2px 0 3px rgba(0,0,0,0.1) inset,-5px 5px 20px rgba(0,0,0,0.2) inset,0 0 3px rgba(0,0,0,0.2);
        background: linear-gradient(to bottom,#fff 0%,#e9e9e9 100%)
      }
      &.A, &.C, &.D, &.F, &.G {
        margin-right: -30px;
      }
    }
    &.black {
      min-width: 30px;
      background-color: #000;
      color: #fff;
      height: 55%;
      position: relative;
      right: -15px;
      z-index: 2;
      border:1px solid #000;
      border-radius:0 0 3px 3px;
      box-shadow:-1px -1px 2px rgba(255,255,255,0.2) inset,0 -5px 2px 3px rgba(0,0,0,0.6) inset,0 2px 4px rgba(0,0,0,0.5);
      background:linear-gradient(45deg,#222 0%,#555 100%);
      &:active {
        box-shadow:-1px -1px 2px rgba(255,255,255,0.2) inset,0 -2px 2px 3px rgba(0,0,0,0.6) inset,0 1px 2px rgba(0,0,0,0.5);
        background:linear-gradient(to right,#444 0%,#222 100%)
      }
    }
  }
}

</style>
