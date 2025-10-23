<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { UserPlus, Mail, Lock, Calendar, Users } from 'lucide-vue-next'

/**
 * Register/Signup View
 * Allows new users to create an account
 */
const router = useRouter()
const authStore = useAuthStore()

// Form state
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref<'ATTENDEE' | 'ORGANIZER'>('ATTENDEE')
const error = ref('')
const loading = ref(false)

/**
 * Handle registration form submission
 */
const handleRegister = async () => {
  // Reset error
  error.value = ''
  
  // Validate inputs
  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = 'Please fill in all fields'
    return
  }

  // Check password length
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  // Check if passwords match
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    await authStore.register(email.value, password.value, role.value)
    
    // Redirect to home page on success
    router.push('/')
  } catch (err: any) {
    // Display error message
    error.value = err.response?.data?.error || 'Failed to create account. Please try again.'
  } finally {
    loading.value = false
  }
}

/**
 * Navigate to login page
 */
const goToLogin = () => {
  router.push('/login')
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
          Create Account
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Join us and start managing events
        </p>
      </div>

      <!-- Registration Form Card -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        <form @submit.prevent="handleRegister" class="space-y-6">
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
                minlength="6"
                class="input pl-10"
                placeholder="••••••••"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Must be at least 6 characters
            </p>
          </div>

          <!-- Confirm Password Input -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                class="input pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <!-- Role Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              I want to join as
            </label>
            <div class="grid grid-cols-2 gap-3">
              <!-- Attendee Option -->
              <button
                type="button"
                @click="role = 'ATTENDEE'"
                :class="[
                  'relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200',
                  role === 'ATTENDEE'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
              >
                <UserPlus :class="[
                  'w-8 h-8 mb-2',
                  role === 'ATTENDEE' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                ]" />
                <span :class="[
                  'text-sm font-medium',
                  role === 'ATTENDEE' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                ]">
                  Attendee
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Browse & RSVP to events
                </span>
                <div v-if="role === 'ATTENDEE'" class="absolute top-2 right-2">
                  <div class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              </button>

              <!-- Organizer Option -->
              <button
                type="button"
                @click="role = 'ORGANIZER'"
                :class="[
                  'relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200',
                  role === 'ORGANIZER'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
              >
                <Calendar :class="[
                  'w-8 h-8 mb-2',
                  role === 'ORGANIZER' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                ]" />
                <span :class="[
                  'text-sm font-medium',
                  role === 'ORGANIZER' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
                ]">
                  Organizer
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Create & manage events
                </span>
                <div v-if="role === 'ORGANIZER'" class="absolute top-2 right-2">
                  <div class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
              </button>
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
            <UserPlus class="w-5 h-5" />
            <span class="font-semibold">{{ loading ? 'Creating Account...' : 'Create Account' }}</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <button
              @click="goToLogin"
              class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
