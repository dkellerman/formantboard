import { createRouter, createWebHistory } from 'vue-router';
import routes from '~pages';
import "primevue/resources/primevue.min.css";
import './tailwind.css';
import App from './App.vue';

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App)
  .use(router)
  .mount('#app');
