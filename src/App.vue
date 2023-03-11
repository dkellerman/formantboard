<script setup lang="ts">
const drawer = ref(false);
const route = useRoute();
watch(route, () => {
  drawer.value = false;
});
</script>

<template>
  <v-layout>
    <v-app-bar density="compact">
      <template #prepend>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      </template>
      <v-app-bar-title>
        <router-link to="/">
          FormantBoard
        </router-link>
      </v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" location="left" temporary :width="375" color="#f0f8ff ">
      <v-list>
        <v-list-item>
          <router-link to="/">
            Home
          </router-link>
        </v-list-item>
        <v-list-item>
          <router-link to="/sandbox">
            Sandbox
          </router-link>
        </v-list-item>
        <v-list-item>
          <a href="https://github.com/dkellerman/formantboard">
            Github
          </a>
        </v-list-item>
        <v-list-item>
          <a href="https://bipium.com">
            Metronome
          </a>
        </v-list-item>
        <v-list-item>
          <a href="https://rhymium.com">
            Song Rhymes
          </a>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

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

.v-navigation-drawer {
  a {
    color: black;
    text-decoration: none;
    font-size: 20px;
    &:hover {
      text-decoration: underline;
    }
  }
}

main {
  margin-top: 30px;
}
</style>
