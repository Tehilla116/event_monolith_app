import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Create Vue app instance
const app = createApp(App)

// Create Pinia store instance
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)

// Mount the app to the DOM
app.mount('#app')
