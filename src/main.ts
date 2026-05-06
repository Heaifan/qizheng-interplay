import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './app/App.vue';
import './styles/layout.css';
import './styles/controls.css';
import './styles/battlefield.css';
import './styles/log-panel.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
