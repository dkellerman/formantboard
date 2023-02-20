import 'papercss/dist/paper.min.css';
import './style.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Vue3TouchEvents from 'vue3-touch-events';
import App from './App.vue';

const store = createPinia();

createApp(App).use(store).use(Vue3TouchEvents).mount('#app');
