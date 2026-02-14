import { createRouter, createWebHistory } from 'vue-router';
import routes from '~pages';
import "primevue/resources/primevue.min.css";
import './tailwind.css';
import App from './App.vue';

const store = createPinia();

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App)
  .use(router)
  .use(store)
  .mount('#app');
