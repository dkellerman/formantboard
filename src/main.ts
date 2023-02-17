import { createApp } from 'vue';
import 'papercss/dist/paper.min.css';
import './style.scss';
import App from './App.vue';
import { createPinia } from 'pinia';

const store = createPinia();

createApp(App).use(store).mount('#app');
