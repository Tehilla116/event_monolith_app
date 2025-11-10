<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useEventsStore } from '../stores/events'
import EventCard from '../components/EventCard.vue'
import EventCardSkeleton from '../components/EventCardSkeleton.vue'
import CreateEventModal from '../components/CreateEventModal.vue'
import AdminActionsModal from '../components/AdminActionsModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import Toast from '../components/Toast.vue'
import type { Event } from '../types'

/**
 * Home/Dashboard View
 * Main page showing all events with create functionality
 */
const authStore = useAuthStore()
const eventsStore = useEventsStore()

// Modal state
const showCreateModal = ref(false)
const showAdminModal = ref(false)
const showConfirmModal = ref(false)
const eventToEdit = ref<Event | null>(null)
const selectedAdminEvent = ref<Event | null>(null)
const eventToDelete = ref<string | null>(null)

// Toast state
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success')
const showToast = ref(false)

/**
 * Filter events based on user role
 * ATTENDEE: Only approved events
 * ORGANIZER: All their events (approved + pending)
 * ADMIN: All events (approved + pending)
 */
const displayedEvents = computed(() => {
  // For ATTENDEES, only show approved events
  if (authStore.userRole === 'ATTENDEE') {
    return eventsStore.events.filter(event => event.approved)
  }
  
  // For ORGANIZERS and ADMINS, show all events
  return eventsStore.events
})

/**
 * Show toast notification
 */
const showToastNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
}

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
  eventToEdit.value = null
  showCreateModal.value = !showCreateModal.value
}

/**
 * Handle event edit
 */
const handleEventEdit = (event: any) => {
  eventToEdit.value = event
  showCreateModal.value = true
}

/**
 * Handle successful event creation/update
 */
const handleEventCreated = () => {
  showCreateModal.value = false
  eventToEdit.value = null
  showToastNotification('Event created successfully! 🎉', 'success')
}

/**
 * Handle successful event update
 */
const handleEventUpdated = () => {
  showCreateModal.value = false
  eventToEdit.value = null
  showToastNotification('Event updated successfully! ✅', 'success')
}

/**
 * Handle admin card click
 */
const handleAdminCardClick = (event: Event) => {
  selectedAdminEvent.value = event
  showAdminModal.value = true
}

/**
 * Handle event delete from card
 */
const handleEventDelete = (event: Event) => {
  selectedAdminEvent.value = event
  eventToDelete.value = event.id
  showConfirmModal.value = true
}

/**
 * Handle admin modal close
 */
const handleAdminModalClose = () => {
  showAdminModal.value = false
  selectedAdminEvent.value = null
}

/**
 * Handle admin delete
 */
const handleAdminDelete = async (eventId: string) => {
  eventToDelete.value = eventId
  showConfirmModal.value = true
}

/**
 * Confirm delete action
 */
const confirmDelete = async () => {
  if (!eventToDelete.value) return
  
  try {
    await eventsStore.deleteEvent(eventToDelete.value)
    showAdminModal.value = false
    selectedAdminEvent.value = null
    showConfirmModal.value = false
    eventToDelete.value = null
    showToastNotification('Event deleted successfully', 'success')
  } catch (error) {
    console.error('Error deleting event:', error)
    showConfirmModal.value = false
    showToastNotification('Failed to delete event', 'error')
  }
}

/**
 * Cancel delete action
 */
const cancelDelete = () => {
  showConfirmModal.value = false
  eventToDelete.value = null
}

/**
 * Computed property for delete confirmation message
 */
const deleteConfirmMessage = computed(() => {
  const eventTitle = selectedAdminEvent.value?.title || 'this event'
  return `Are you sure you want to delete "${eventTitle}"? This will send email notifications to all attendees who have RSVPed.`
})

/**
 * Handle admin edit
 */
const handleAdminEdit = (event: Event) => {
  showAdminModal.value = false
  selectedAdminEvent.value = null
  eventToEdit.value = event
  showCreateModal.value = true
}

/**
 * Handle approve event
 */
const handleApprove = async (eventId: string) => {
  try {
    await eventsStore.approveEvent(eventId)
    showAdminModal.value = false
    selectedAdminEvent.value = null
    showToastNotification('Event approved successfully', 'success')
  } catch (error) {
    console.error('Error approving event:', error)
    showToastNotification('Failed to approve event', 'error')
  }
}

/**
 * Handle reject event (delete)
 */
const handleReject = async (eventId: string) => {
  try {
    await eventsStore.deleteEvent(eventId)
    showAdminModal.value = false
    selectedAdminEvent.value = null
    showToastNotification('Event rejected and deleted', 'success')
  } catch (error) {
    console.error('Error rejecting event:', error)
    showToastNotification('Failed to reject event', 'error')
  }
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

    <!-- Loading State with Skeletons -->
    <div v-if="eventsStore.loading && eventsStore.events.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <EventCardSkeleton v-for="n in 6" :key="n" />
    </div>

    <!-- Error State -->
    <div v-else-if="eventsStore.error" class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <p class="text-red-600 dark:text-red-400">
        {{ eventsStore.error }}
      </p>
    </div>

    <!-- Empty State -->
    <div v-else-if="displayedEvents.length === 0" class="text-center py-12">
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
        v-for="event in displayedEvents"
        :key="event.id"
        :event="event"
        @edit="handleEventEdit"
        @admin-click="handleAdminCardClick"
        @delete="handleEventDelete"
      />
    </div>

    <!-- Create/Edit Event Modal -->
    <CreateEventModal
      v-if="showCreateModal"
      :event-to-edit="eventToEdit"
      @close="toggleCreateModal"
      @created="handleEventCreated"
      @updated="handleEventUpdated"
    />

    <!-- Admin Actions Modal -->
    <AdminActionsModal
      :show="showAdminModal"
      :event="selectedAdminEvent"
      @close="handleAdminModalClose"
      @delete="handleAdminDelete"
      @edit="handleAdminEdit"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :show="showConfirmModal"
      title="Delete Event?"
      :message="deleteConfirmMessage"
      type="danger"
      confirm-text="Delete Event"
      cancel-text="Cancel"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Toast Notification -->
    <Toast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="showToast = false"
    />
  </div>
</template>
