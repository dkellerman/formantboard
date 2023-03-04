import { createRouter, createWebHistory } from 'vue-router';
import routes from '~pages';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import './styles.scss';
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
  defaults: {
    VTextField: {
      density: 'compact',
      variant: 'outlined',
    },
    VCheckbox: {
      density: 'compact',
      variant: 'outlined',
    },
    VSelect: {
      density: 'compact',
      variant: 'outlined',
    },
    VBtnToggle: {
      density: 'compact',
      divided: true,
    }
  },
});

createApp(App)
  .use(router)
  .use(store)
  .use(vuetify)
  .mount('#app');
