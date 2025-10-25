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

const remainingSpots = computed(() => {
  if (!props.event.maxAttendees) return null // Unlimited capacity
  return props.event.maxAttendees - rsvpCounts.value.going
})

const isEventFull = computed(() => {
  if (!props.event.maxAttendees) return false // Unlimited capacity
  return remainingSpots.value !== null && remainingSpots.value <= 0
})

const capacityPercentage = computed(() => {
  if (!props.event.maxAttendees) return 0
  return (rsvpCounts.value.going / props.event.maxAttendees) * 100
})

const capacityClass = computed(() => {
  const pct = capacityPercentage.value
  if (pct >= 100) return 'text-red-600 dark:text-red-400'
  if (pct >= 80) return 'text-orange-600 dark:text-orange-400'
  if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
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
    class="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-200 dark:border-gray-700 flex flex-col h-full"
  >
    <!-- Header -->
    <div class="flex-1">
      <!-- Status Badges -->
      <div class="flex items-center gap-2 mb-3 flex-wrap">
        <span
          v-if="!event.approved"
          class="badge badge-warning text-xs"
        >
          Pending Approval
        </span>
        <span
          v-if="isEventPast"
          class="badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs"
        >
          Past Event
        </span>
      </div>

      <!-- Title -->
      <h3 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
        {{ event.title }}
      </h3>

      <!-- Description -->
      <p class="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
        {{ event.description }}
      </p>

      <!-- Event Details -->
      <div class="space-y-2 mb-4">
        <!-- Date -->
        <div class="flex items-start text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <Calendar class="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <span class="break-words">{{ formattedDate }}</span>
        </div>

        <!-- Location -->
        <div class="flex items-start text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <MapPin class="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
          <span class="break-words">{{ event.location }}</span>
        </div>

        <!-- Organizer -->
        <div v-if="event.organizer" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <User class="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{{ event.organizer.email }}</span>
        </div>
      </div>

      <!-- RSVP Stats -->
      <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-1">
          <CheckCircle class="w-4 h-4 text-green-500" />
          <span>{{ rsvpCounts.going }} Going</span>
        </div>
        <div class="flex items-center gap-1">
          <HelpCircle class="w-4 h-4 text-yellow-500" />
          <span>{{ rsvpCounts.maybe }} Maybe</span>
        </div>
      </div>

      <!-- Capacity Information -->
      <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Event Capacity</span>
          <span class="text-sm font-semibold" :class="capacityClass">
            <span v-if="!event.maxAttendees" class="text-blue-600 dark:text-blue-400">Unlimited</span>
            <span v-else-if="isEventFull" class="text-red-600 dark:text-red-400">FULL</span>
            <span v-else>{{ remainingSpots }} {{ remainingSpots === 1 ? 'spot' : 'spots' }} left</span>
          </span>
        </div>
        <div v-if="event.maxAttendees" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            class="h-full rounded-full transition-all duration-300"
            :class="{
              'bg-green-500': capacityPercentage < 50,
              'bg-yellow-500': capacityPercentage >= 50 && capacityPercentage < 80,
              'bg-orange-500': capacityPercentage >= 80 && capacityPercentage < 100,
              'bg-red-500': capacityPercentage >= 100
            }"
            :style="{ width: Math.min(capacityPercentage, 100) + '%' }"
          ></div>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ rsvpCounts.going }} {{ event.maxAttendees ? `/ ${event.maxAttendees}` : '' }} attendees
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
      <div v-if="userRole === 'ATTENDEE' && event.approved && !isEventPast" class="flex flex-col sm:flex-row gap-2">
        <button
          @click="handleRsvp('GOING')"
          :disabled="loading || (isEventFull && userRsvp?.status !== 'GOING')"
          class="flex-1 btn btn-success text-xs sm:text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed justify-center"
          :class="{ 'ring-2 ring-green-500': userRsvp?.status === 'GOING' }"
          :title="isEventFull && userRsvp?.status !== 'GOING' ? 'Event is full' : ''"
        >
          <CheckCircle class="w-4 h-4 mr-1" />
          {{ isEventFull && userRsvp?.status !== 'GOING' ? 'Full' : 'Going' }}
        </button>
        <button
          @click="handleRsvp('MAYBE')"
          :disabled="loading"
          class="flex-1 btn bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 text-xs sm:text-sm py-2 disabled:opacity-50 justify-center"
          :class="{ 'ring-2 ring-yellow-500': userRsvp?.status === 'MAYBE' }"
        >
          <HelpCircle class="w-4 h-4 mr-1" />
          Maybe
        </button>
        <button
          @click="handleRsvp('NOT_GOING')"
          :disabled="loading"
          class="flex-1 btn bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400 text-xs sm:text-sm py-2 disabled:opacity-50 justify-center"
          :class="{ 'ring-2 ring-gray-500': userRsvp?.status === 'NOT_GOING' }"
        >
          <XCircle class="w-4 h-4 mr-1" />
          Not Going
        </button>
      </div>

      <!-- ORGANIZER: Edit & Delete Buttons -->
      <div v-if="userRole === 'ORGANIZER' && isEventOwner" class="flex flex-col sm:flex-row gap-2">
        <button
          @click="handleEdit"
          :disabled="loading"
          class="flex-1 btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 text-xs sm:text-sm py-2 disabled:opacity-50 justify-center"
        >
          <Pencil class="w-4 h-4 mr-1" />
          Edit
        </button>
        <button
          @click="handleDelete"
          :disabled="loading"
          class="flex-1 btn btn-danger text-xs sm:text-sm py-2 disabled:opacity-50 justify-center"
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
          class="w-full btn bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 text-xs sm:text-sm py-2 disabled:opacity-50 justify-center"
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
