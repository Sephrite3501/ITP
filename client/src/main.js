import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router/index.js';
import { createPinia } from 'pinia'

// Global CSS
import './assets/styles/base.css';
import './assets/styles/main.css';
// Optional: Only if needed
// import './assets/styles/global.css';

const app = createApp(App)
app.use(createPinia())  // ✅ use before mounting
app.use(router)
app.mount('#app')
