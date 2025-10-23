import axios from 'axios'

/**
 * Axios instance configured for the Event Management API
 * Base URL: http://localhost:8080
 */
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

/**
 * Request interceptor
 * Automatically adds Authorization header with JWT token to every request
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (will be synced with Pinia store later)
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Response interceptor
 * Handles common error responses (e.g., 401 Unauthorized)
 */
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
