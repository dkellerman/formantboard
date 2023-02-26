import { createRouter, createWebHistory } from 'vue-router';
import routes from '~pages';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import App from './App.vue';

const store = createPinia();

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const vuetify = createVuetify({
  components,
  directives,
});

createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app');
