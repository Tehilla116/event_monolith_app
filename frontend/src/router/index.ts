import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/**
 * Router Configuration
 * Defines all application routes with authentication guards
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Public Routes - Authentication
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false, hideForAuth: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/Register.vue'),
      meta: { requiresAuth: false, hideForAuth: true },
    },

    // Protected Routes - Main App (with Layout)
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/Home.vue'),
        },
      ],
    },

    // Catch-all route - 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

/**
 * Global Navigation Guard
 * Handles authentication checks before each route change
 */
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth !== false

  // Check if route should be hidden when authenticated (e.g., login page)
  const hideForAuth = to.meta.hideForAuth === true

  if (requiresAuth && !isAuthenticated) {
    // User is not authenticated and trying to access protected route
    // Redirect to login page
    next('/login')
  } else if (hideForAuth && isAuthenticated) {
    // User is authenticated and trying to access login/signup
    // Redirect to home page
    next('/')
  } else {
    // Allow navigation
    next()
  }
})

export default router
