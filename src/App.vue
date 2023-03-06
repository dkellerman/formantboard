<script setup lang="ts">
const drawer = ref(false);
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
            Hyper-Advanced Control Center
          </router-link>
        </v-list-item>
        <v-list-item>
          <router-link to="https://github.com/dkellerman/formantboard">
            Github
          </router-link>
        </v-list-item>
        <v-list-item>
          <router-link to="https://bipium.com">
            Metronome
          </router-link>
        </v-list-item>
        <v-list-item>
          <router-link to="https://rhymium.com">
            Rhyme Dictionary
          </router-link>
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
