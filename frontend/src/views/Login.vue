<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { LogIn, Mail, Lock, Calendar } from 'lucide-vue-next'

/**
 * Login View
 * Allows users to authenticate with email and password
 */
const router = useRouter()
const authStore = useAuthStore()

// Form state
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

/**
 * Handle login form submission
 */
const handleLogin = async () => {
  // Reset error
  error.value = ''
  
  // Validate inputs
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    
    // Redirect to home page on success
    router.push('/')
  } catch (err: any) {
    // Display error message
    error.value = err.response?.data?.error || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}

/**
 * Navigate to signup page
 */
const goToSignup = () => {
  router.push('/signup')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
    <div class="max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <div class="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
            <Calendar class="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Sign in to manage your events
        </p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="input pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">
              {{ error }}
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn class="w-5 h-5" />
            <span class="font-semibold">{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Signup Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <button
              @click="goToSignup"
              class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
