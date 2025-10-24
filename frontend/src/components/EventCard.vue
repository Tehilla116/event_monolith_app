<script setup lang="ts">
import { ref, computed } from 'vue'
import { Calendar, MapPin, User, Pencil, Trash2, CheckCircle, XCircle, HelpCircle, Settings } from 'lucide-vue-next'
import { format } from 'date-fns'
import { useAuthStore } from '../stores/auth'
import { useEventsStore } from '../stores/events'
import type { Event } from '../types'

/**
 * EventCard Component
 * Displays event information with role-based actions
 */

// Props
interface Props {
  event: Event
}

const props = defineProps<Props>()

// Stores
const authStore = useAuthStore()
const eventsStore = useEventsStore()

// State
const loading = ref(false)

// Computed
const userRole = computed(() => authStore.userRole)

const formattedDate = computed(() => {
  try {
    return format(new Date(props.event.date), 'PPP p') // e.g., "April 29, 2023 at 9:00 AM"
  } catch {
    return props.event.date
  }
})

const isEventPast = computed(() => {
  return new Date(props.event.date) < new Date()
})

const userRsvp = computed(() => {
  if (!authStore.user || !props.event.rsvps) return null
  return props.event.rsvps.find(rsvp => rsvp.userId === authStore.user?.id)
})

const rsvpCounts = computed(() => {
  if (!props.event.rsvps) return { going: 0, maybe: 0, notGoing: 0 }
  
  return {
    going: props.event.rsvps.filter(r => r.status === 'GOING').length,
    maybe: props.event.rsvps.filter(r => r.status === 'MAYBE').length,
    notGoing: props.event.rsvps.filter(r => r.status === 'NOT_GOING').length,
  }
})

const isEventOwner = computed(() => {
  console.log('Checking event ownership:', {
    eventOrganizerId: props.event.organizerId,
    userId: authStore.user?.id,
    userRole: userRole.value,
    isOwner: props.event.organizerId === authStore.user?.id
  })
  return props.event.organizerId === authStore.user?.id
})

/**
 * Handle RSVP action
 */
const handleRsvp = async (status: 'GOING' | 'MAYBE' | 'NOT_GOING') => {
  loading.value = true
  try {
    await eventsStore.rsvpToEvent(props.event.id, status)
  } catch (error) {
    console.error('Error RSVPing:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Handle event deletion
 */
const handleDelete = () => {
  emit('delete', props.event)
}

// Emits
const emit = defineEmits<{
  edit: [event: Event]
  adminClick: [event: Event]
  delete: [event: Event]
}>()

/**
 * Handle edit - emit event to parent
 */
const handleEdit = () => {
  emit('edit', props.event)
}

/**
 * Handle card click for admin
 */
const handleCardClick = () => {
  if (userRole.value === 'ADMIN') {
    emit('adminClick', props.event)
  }
}
</script>

<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700 flex flex-col h-full"
  >
    <!-- Header -->
    <div class="flex-1">
      <!-- Status Badges -->
      <div class="flex items-center gap-2 mb-3">
        <span
          v-if="!event.approved"
          class="badge badge-warning"
        >
          Pending Approval
        </span>
        <span
          v-if="isEventPast"
          class="badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        >
          Past Event
        </span>
      </div>

      <!-- Title -->
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ event.title }}
      </h3>

      <!-- Description -->
      <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
        {{ event.description }}
      </p>

      <!-- Event Details -->
      <div class="space-y-2 mb-4">
        <!-- Date -->
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Calendar class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ formattedDate }}</span>
        </div>

        <!-- Location -->
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <MapPin class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ event.location }}</span>
        </div>

        <!-- Organizer -->
        <div v-if="event.organizer" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <User class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ event.organizer.email }}</span>
        </div>
      </div>

      <!-- RSVP Stats -->
      <div v-if="event.rsvps && event.rsvps.length > 0" class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-1">
          <CheckCircle class="w-4 h-4 text-green-500" />
          <span>{{ rsvpCounts.going }} Going</span>
        </div>
        <div class="flex items-center gap-1">
          <HelpCircle class="w-4 h-4 text-yellow-500" />
          <span>{{ rsvpCounts.maybe }} Maybe</span>
        </div>
      </div>

      <!-- Current User's RSVP Status -->
      <div v-if="userRsvp" class="mb-4">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
          :class="{
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': userRsvp.status === 'GOING',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': userRsvp.status === 'MAYBE',
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': userRsvp.status === 'NOT_GOING',
          }"
        >
          <CheckCircle v-if="userRsvp.status === 'GOING'" class="w-4 h-4" />
          <HelpCircle v-if="userRsvp.status === 'MAYBE'" class="w-4 h-4" />
          <XCircle v-if="userRsvp.status === 'NOT_GOING'" class="w-4 h-4" />
          <span>You're {{ userRsvp.status === 'GOING' ? 'Going' : userRsvp.status === 'MAYBE' ? 'Maybe' : 'Not Going' }}</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="mt-4 space-y-2">
      <!-- ATTENDEE: RSVP Buttons -->
      <div v-if="userRole === 'ATTENDEE' && event.approved && !isEventPast" class="flex gap-2">
        <button
          @click="handleRsvp('GOING')"
          :disabled="loading"
          class="flex-1 btn btn-success text-sm py-2 disabled:opacity-50"
          :class="{ 'ring-2 ring-green-500': userRsvp?.status === 'GOING' }"
        >
          <CheckCircle class="w-4 h-4 mr-1" />
          Going
        </button>
        <button
          @click="handleRsvp('MAYBE')"
          :disabled="loading"
          class="flex-1 btn bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 text-sm py-2 disabled:opacity-50"
          :class="{ 'ring-2 ring-yellow-500': userRsvp?.status === 'MAYBE' }"
        >
          <HelpCircle class="w-4 h-4 mr-1" />
          Maybe
        </button>
        <button
          @click="handleRsvp('NOT_GOING')"
          :disabled="loading"
          class="flex-1 btn bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400 text-sm py-2 disabled:opacity-50"
          :class="{ 'ring-2 ring-gray-500': userRsvp?.status === 'NOT_GOING' }"
        >
          <XCircle class="w-4 h-4 mr-1" />
          Not Going
        </button>
      </div>

      <!-- ORGANIZER: Edit & Delete Buttons -->
      <div v-if="userRole === 'ORGANIZER' && isEventOwner" class="flex gap-2">
        <button
          @click="handleEdit"
          :disabled="loading"
          class="flex-1 btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 text-sm py-2 disabled:opacity-50"
        >
          <Pencil class="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          @click="handleDelete"
          :disabled="loading"
          class="flex-1 btn btn-danger text-sm py-2 disabled:opacity-50"
        >
          <Trash2 class="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>

      <!-- ADMIN: Manage Event Button -->
      <div v-if="userRole === 'ADMIN'">
        <button
          @click.stop="handleCardClick"
          :disabled="loading"
          class="w-full btn bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 text-sm py-2 disabled:opacity-50"
        >
          <Settings class="w-4 h-4 mr-1" />
          Manage Event
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-2">
        <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
