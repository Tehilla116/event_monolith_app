<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

/**
 * Root App Component
 * Initializes authentication state on mount
 */
const authStore = useAuthStore()

// Check and restore authentication state on app load
onMounted(() => {
  authStore.checkAuth()
})
</script>

<template>
  <router-view />
</template>
