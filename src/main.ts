import './style.scss';

import { createRouter, createWebHistory } from 'vue-router';
import routes from '~pages';
import App from './App.vue';

const store = createPinia();

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).use(store).mount('#app');
