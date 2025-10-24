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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-3 sm:px-4 py-8">
    <div class="max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-6 sm:mb-8">
        <div class="flex justify-center mb-4">
          <div class="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
            <Calendar class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <h1 class="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome Back
        </h1>
        <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Sign in to manage your events
        </p>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        <form @submit.prevent="handleLogin" class="space-y-5 sm:space-y-6">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="input pl-9 sm:pl-10 text-sm sm:text-base"
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
                <Lock class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="input pl-9 sm:pl-10 text-sm sm:text-base"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-xs sm:text-sm text-red-600 dark:text-red-400">
              {{ error }}
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary py-2.5 sm:py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <LogIn class="w-4 h-4 sm:w-5 sm:h-5" />
            <span class="font-semibold">{{ loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Signup Link -->
        <div class="mt-5 sm:mt-6 text-center">
          <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
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
