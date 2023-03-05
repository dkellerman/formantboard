<script setup lang="ts"></script>

<template>
  <v-layout>
    <v-app-bar>
      <v-app-bar-title>
        <router-link to="/">
          FormantBoard
        </router-link>
      </v-app-bar-title>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-layout>
</template>

<style scoped lang="scss">
.v-toolbar {
  background: aliceblue;
  a {
    color: black;
    text-decoration: none;
  }
}

main {
  margin-top: 30px;
}
</style>
