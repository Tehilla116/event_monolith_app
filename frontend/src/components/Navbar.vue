<script setup lang="ts">
import { LogOut, Calendar } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

/**
 * Navbar Component
 * Displays app title, user info, and logout button
 */
const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Left: App Title & Logo -->
        <div class="flex items-center space-x-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
            <Calendar class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Event Manager
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Manage your events seamlessly
            </p>
          </div>
        </div>

        <!-- Right: User Info & Logout -->
        <div class="flex items-center space-x-4">
          <!-- User Info -->
          <div v-if="authStore.user" class="text-right">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ authStore.user.email }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Role: 
              <span 
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': authStore.user.role === 'ADMIN',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': authStore.user.role === 'ORGANIZER',
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': authStore.user.role === 'ATTENDEE',
                }"
              >
                {{ authStore.user.role }}
              </span>
            </p>
          </div>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
