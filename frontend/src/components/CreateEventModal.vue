<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Calendar, MapPin, FileText, Clock } from 'lucide-vue-next'
import { useEventsStore } from '../stores/events'
import type { Event } from '../types'

/**
 * CreateEventModal Component
 * Modal for creating or editing events
 */

// Props
interface Props {
  eventToEdit?: Event | null
}

const props = withDefaults(defineProps<Props>(), {
  eventToEdit: null
})

// Emits
const emit = defineEmits<{
  close: []
  created: []
  updated: []
}>()

// Store
const eventsStore = useEventsStore()

// Form state
const title = ref('')
const description = ref('')
const date = ref('')
const time = ref('')
const location = ref('')
const error = ref('')
const loading = ref(false)

// Computed
const isEditMode = computed(() => !!props.eventToEdit)
const modalTitle = computed(() => isEditMode.value ? 'Edit Event' : 'Create New Event')
const submitButtonText = computed(() => isEditMode.value ? 'Update Event' : 'Create Event')

/**
 * Initialize form with event data if editing
 */
watch(() => props.eventToEdit, (event) => {
  if (event) {
    title.value = event.title
    description.value = event.description
    location.value = event.location
    
    // Split date and time
    try {
      const eventDate = new Date(event.date)
      date.value = eventDate.toISOString().split('T')[0] // YYYY-MM-DD
      time.value = eventDate.toTimeString().slice(0, 5) // HH:MM
    } catch (err) {
      console.error('Error parsing date:', err)
    }
  }
}, { immediate: true })

/**
 * Close modal
 */
const closeModal = () => {
  emit('close')
}

/**
 * Handle form submission
 */
const handleSubmit = async () => {
  // Reset error
  error.value = ''
  
  // Validate inputs
  if (!title.value || !description.value || !date.value || !time.value || !location.value) {
    error.value = 'Please fill in all fields'
    return
  }

  // Combine date and time
  const dateTime = `${date.value}T${time.value}:00`
  
  // Validate date is in the future
  if (new Date(dateTime) < new Date()) {
    error.value = 'Event date must be in the future'
    return
  }

  loading.value = true

  try {
    const eventData = {
      title: title.value,
      description: description.value,
      date: dateTime,
      location: location.value,
    }

    if (isEditMode.value && props.eventToEdit) {
      // Update existing event
      await eventsStore.updateEvent(props.eventToEdit.id, eventData)
      emit('updated')
      // Reset form
      resetForm()
    } else {
      // Create new event
      await eventsStore.createEvent(eventData)
      emit('created')
      // Reset form
      resetForm()
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || `Failed to ${isEditMode.value ? 'update' : 'create'} event`
  } finally {
    loading.value = false
  }
}

/**
 * Reset form fields
 */
const resetForm = () => {
  title.value = ''
  description.value = ''
  date.value = ''
  time.value = ''
  location.value = ''
  error.value = ''
}

/**
 * Handle backdrop click
 */
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

/**
 * Get minimum date for date input (today)
 */
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})
</script>

<template>
  <!-- Modal Overlay -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
    @click="handleBackdropClick"
  >
    <!-- Modal Content -->
    <div 
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ modalTitle }}
        </h2>
        <button
          @click="closeModal"
          class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Modal Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Title *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FileText class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="title"
              v-model="title"
              type="text"
              required
              class="input pl-10"
              placeholder="Enter event title"
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            v-model="description"
            required
            rows="4"
            class="input resize-none"
            placeholder="Describe your event..."
          ></textarea>
        </div>

        <!-- Date and Time -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Date -->
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="date"
                v-model="date"
                type="date"
                required
                :min="minDate"
                class="input pl-10"
              />
            </div>
          </div>

          <!-- Time -->
          <div>
            <label for="time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time *
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="time"
                v-model="time"
                type="time"
                required
                class="input pl-10"
              />
            </div>
          </div>
        </div>

        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location *
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="location"
              v-model="location"
              type="text"
              required
              class="input pl-10"
              placeholder="Enter event location"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">
            {{ error }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 btn-secondary py-3"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Saving...' : submitButtonText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
