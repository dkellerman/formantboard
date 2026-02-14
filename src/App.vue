<script setup lang="ts">
const drawer = ref(false);
const route = useRoute();
watch(() => route.fullPath, () => {
  drawer.value = false;
});
</script>

<template>
  <div class="min-h-screen">
    <header
      class="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-zinc-300 bg-sky-50 px-3 shadow-sm"
    >
      <button
        :class="[
          'relative z-[60] inline-flex h-9 w-9 items-center justify-center text-xl text-zinc-700',
          'transition-colors hover:bg-zinc-200',
        ]"
        type="button"
        @click="drawer = !drawer"
      >
        ☰
      </button>
      <h1 class="m-0 text-xl font-medium tracking-tight">
        <router-link to="/" class="text-zinc-900 no-underline hover:underline">
          FormantBoard
        </router-link>
      </h1>
    </header>

    <aside
      v-if="drawer"
      :class="[
        'fixed left-0 top-0 z-40 h-screen w-[85vw] max-w-[375px] border-r border-zinc-300',
        'bg-sky-50 p-5 shadow-lg',
      ]"
    >
      <nav class="mt-14 flex flex-col gap-4 text-xl">
        <router-link to="/" class="text-zinc-900 no-underline hover:underline">
          Home
        </router-link>
        <router-link to="/sandbox" class="text-zinc-900 no-underline hover:underline">
          Sandbox
        </router-link>
        <a href="https://github.com/dkellerman/formantboard" class="text-zinc-900 no-underline hover:underline">
          Github
        </a>
        <a href="https://bipium.com" class="text-zinc-900 no-underline hover:underline">
          Metronome
        </a>
      </nav>
    </aside>

    <button
      v-if="drawer"
      class="fixed inset-0 z-[35] h-screen w-screen border-0 bg-transparent"
      type="button"
      aria-label="Close menu"
      @click="drawer = false"
    />

    <main class="pt-8">
      <router-view />
    </main>
  </div>
</template>
