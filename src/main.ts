import { createApp } from 'vue';
import 'papercss/dist/paper.min.css';
import './style.scss';
import App from './App.vue';
import { createPinia } from 'pinia';
import Vue3TouchEvents from 'vue3-touch-events';

const store = createPinia();

createApp(App).use(store).use(Vue3TouchEvents).mount('#app');
