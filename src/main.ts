import { createRouter, createWebHistory } from 'vue-router';
import routes from '~pages';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import "primevue/resources/primevue.min.css";
import './styles.scss';
import { createVuetify } from 'vuetify';
import { VTextField } from 'vuetify/components/VTextField';
import App from './App.vue';

const store = createPinia();

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const vuetify = createVuetify({
  aliases: {
    VNum: VTextField,
  },
  defaults: {
    VNum: {
      density: 'compact',
      variant: 'outlined',
      type: 'number',
      min: 0,
    },
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
