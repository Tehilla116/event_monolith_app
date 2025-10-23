<script setup lang="ts">
import Navbar from '../components/Navbar.vue'

/**
 * Main Layout Component
 * Wraps authenticated pages with navbar and main content area
 */
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation Bar -->
    <Navbar />

    <!-- Main Content Area -->
    <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <router-view />
    </main>
  </div>
</template>
