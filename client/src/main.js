import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router/index.js';
import { createPinia } from 'pinia';

// Tailwind CSS (make sure tailwind.css exists and is built from your pipeline)
import './assets/styles/tailwind.css';

// Global CSS (custom overrides/supplements)
// import './assets/styles/base.css';
import './assets/styles/main.css';


import Toast, { POSITION } from 'vue-toastification';
import 'vue-toastification/dist/index.css';

const app = createApp(App);

app.use(createPinia()); // ✅ state management before mounting
app.use(router);
app.use(Toast, {
  position: POSITION.TOP_RIGHT,
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
});

app.mount('#app');
