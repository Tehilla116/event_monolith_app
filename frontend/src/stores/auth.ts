import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

/**
 * Interface for User object
 */
interface User {
  id: string
  email: string
  role: 'ADMIN' | 'ORGANIZER' | 'ATTENDEE'
}

/**
 * Decode JWT token to extract user information
 * @param token - JWT token string
 * @returns Decoded user object or null
 */
function decodeToken(token: string): User | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]))
    
    console.log('Decoded JWT payload:', payload)
    
    // The user ID might be in 'sub', 'userId', or 'id'
    const userId = payload.sub || payload.userId || payload.id
    
    return {
      id: userId,
      email: payload.email,
      role: payload.role,
    }
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Auth Store
 * Manages user authentication state and actions
 */
export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token') || null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)

  /**
   * Login action
   * Authenticates user with email and password
   */
  async function login(email: string, password: string): Promise<boolean> {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      // Extract token from response
      const receivedToken = response.data.token

      if (!receivedToken) {
        throw new Error('No token received from server')
      }

      // Save token to state and localStorage
      token.value = receivedToken
      localStorage.setItem('token', receivedToken)

      // Decode token to get user information
      const decodedUser = decodeToken(receivedToken)
      
      if (!decodedUser) {
        throw new Error('Failed to decode token')
      }

      user.value = decodedUser
      localStorage.setItem('user', JSON.stringify(decodedUser))

      return true
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Clear any partial state
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      throw error
    }
  }

  /**
   * Register action
   * Creates a new user account
   */
  async function register(email: string, password: string, role: 'ATTENDEE' | 'ORGANIZER' = 'ATTENDEE'): Promise<boolean> {
    try {
      const response = await api.post('/auth/signup', {
        email,
        password,
        role,
      })

      // After successful registration, automatically log in
      return await login(email, password)
    } catch (error: any) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Logout action
   * Clears authentication state and redirects to login
   */
  function logout(): void {
    // Clear state
    user.value = null
    token.value = null

    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Redirect to login page
    window.location.href = '/login'
  }

  /**
   * Check auth action
   * Validates and restores authentication state on app load
   */
  function checkAuth(): void {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    console.log('Checking auth...', { hasToken: !!storedToken, hasUser: !!storedUser })

    if (storedToken) {
      // Set token
      token.value = storedToken

      // Try to get user from localStorage first
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          console.log('Restored user from localStorage:', parsedUser)
          user.value = parsedUser
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }

      // If no user in localStorage or user has no ID, decode token
      if (!user.value || !user.value.id) {
        console.log('Decoding token to get user data...')
        const decodedUser = decodeToken(storedToken)
        console.log('Decoded user:', decodedUser)
        if (decodedUser) {
          user.value = decodedUser
          localStorage.setItem('user', JSON.stringify(decodedUser))
        } else {
          // Invalid token, clear everything
          logout()
        }
      }
    }
  }

  return {
    // State
    user,
    token,
    
    // Getters
    isAuthenticated,
    userRole,
    
    // Actions
    login,
    register,
    logout,
    checkAuth,
  }
})
