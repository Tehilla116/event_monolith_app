<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useEventsStore } from '../stores/events'
import EventCard from '../components/EventCard.vue'
import CreateEventModal from '../components/CreateEventModal.vue'

/**
 * Home/Dashboard View
 * Main page showing all events with create functionality
 */
const authStore = useAuthStore()
const eventsStore = useEventsStore()

// Modal state
const showCreateModal = ref(false)

/**
 * Initialize data on mount
 */
onMounted(async () => {
  // Fetch events from API
  await eventsStore.fetchEvents()
  
  // Connect to WebSocket for real-time updates
  eventsStore.connectWebSocket()
})

/**
 * Cleanup on unmount
 */
onUnmounted(() => {
  eventsStore.disconnectWebSocket()
})

/**
 * Toggle create event modal
 */
const toggleCreateModal = () => {
  showCreateModal.value = !showCreateModal.value
}

/**
 * Handle successful event creation
 */
const handleEventCreated = () => {
  showCreateModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back! Here are all upcoming events.
        </p>
      </div>

      <!-- Create Event Button (ORGANIZER only) -->
      <button
        v-if="authStore.userRole === 'ORGANIZER'"
        @click="toggleCreateModal"
        class="btn-primary flex items-center space-x-2 shadow-lg hover:shadow-xl"
      >
        <Plus class="w-5 h-5" />
        <span>Create Event</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="eventsStore.loading && eventsStore.events.length === 0" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p class="mt-4 text-gray-500 dark:text-gray-400">Loading events...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="eventsStore.error" class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-600 dark:text-red-400">
        {{ eventsStore.error }}
      </p>
    </div>

    <!-- Empty State -->
    <div v-else-if="eventsStore.events.length === 0" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Plus class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No events yet
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-4">
        Get started by creating your first event!
      </p>
      <button
        v-if="authStore.userRole === 'ORGANIZER'"
        @click="toggleCreateModal"
        class="btn-primary inline-flex items-center space-x-2"
      >
        <Plus class="w-5 h-5" />
        <span>Create Event</span>
      </button>
    </div>

    <!-- Events Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <EventCard
        v-for="event in eventsStore.events"
        :key="event.id"
        :event="event"
      />
    </div>

    <!-- Create Event Modal -->
    <CreateEventModal
      v-if="showCreateModal"
      @close="toggleCreateModal"
      @created="handleEventCreated"
    />
  </div>
</template>
