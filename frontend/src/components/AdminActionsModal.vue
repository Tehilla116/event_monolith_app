<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Trash2, Pencil, UserCheck, Calendar, MapPin, User, CheckCircle, HelpCircle, XCircle, Mail } from 'lucide-vue-next'
import { format } from 'date-fns'
import type { Event } from '../types'

interface Props {
  event: Event | null
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  delete: [eventId: string]
  edit: [event: Event]
  approve: [eventId: string]
  reject: [eventId: string]
}>()

const loading = ref(false)
const showAttendees = ref(false)

const formattedDate = (date: string | Date) => {
  try {
    return format(new Date(date), 'PPP p')
  } catch {
    return date
  }
}

const handleDelete = async () => {
  if (!props.event) return
  emit('delete', props.event.id)
}

const handleEdit = () => {
  if (!props.event) return
  emit('edit', props.event)
}

const handleApprove = () => {
  if (!props.event) return
  emit('approve', props.event.id)
}

const handleReject = () => {
  if (!props.event) return
  emit('reject', props.event.id)
}

const handleClose = () => {
  if (!loading.value) {
    emit('close')
  }
}

const rsvpCounts = (event: Event) => {
  if (!event.rsvps) return { going: 0, maybe: 0, notGoing: 0 }
  
  return {
    going: event.rsvps.filter(r => r.status === 'GOING').length,
    maybe: event.rsvps.filter(r => r.status === 'MAYBE').length,
    notGoing: event.rsvps.filter(r => r.status === 'NOT_GOING').length,
  }
}

const attendeesByStatus = computed(() => {
  if (!props.event?.rsvps) return { going: [], maybe: [], notGoing: [] }
  
  return {
    going: props.event.rsvps.filter(r => r.status === 'GOING'),
    maybe: props.event.rsvps.filter(r => r.status === 'MAYBE'),
    notGoing: props.event.rsvps.filter(r => r.status === 'NOT_GOING'),
  }
})

const toggleAttendees = () => {
  showAttendees.value = !showAttendees.value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show && event"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Actions
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage event and notify attendees
                </p>
              </div>
              <button
                @click="handleClose"
                :disabled="loading"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                <X class="w-6 h-6" />
              </button>
            </div>

            <!-- Event Details -->
            <div class="p-6 space-y-4">
              <!-- Title -->
              <div>
                <h4 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ event.title }}
                </h4>
              </div>

              <!-- Description -->
              <div>
                <p class="text-gray-600 dark:text-gray-300">
                  {{ event.description }}
                </p>
              </div>

              <!-- Event Info Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <!-- Date -->
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    <Calendar class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</p>
                    <p class="text-gray-900 dark:text-white">{{ formattedDate(event.date) }}</p>
                  </div>
                </div>

                <!-- Location -->
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <MapPin class="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                    <p class="text-gray-900 dark:text-white">{{ event.location }}</p>
                  </div>
                </div>

                <!-- Organizer -->
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Organizer</p>
                    <p class="text-gray-900 dark:text-white">{{ event.organizer?.email || 'Unknown' }}</p>
                  </div>
                </div>

                <!-- RSVPs -->
                <div class="flex items-start gap-3">
                  <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <UserCheck class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div class="w-full">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Attendees</p>
                    <div class="flex gap-3 text-sm mb-2">
                      <span class="text-green-600 dark:text-green-400">
                        {{ rsvpCounts(event).going }} Going
                      </span>
                      <span class="text-yellow-600 dark:text-yellow-400">
                        {{ rsvpCounts(event).maybe }} Maybe
                      </span>
                    </div>
                    <!-- Capacity Bar -->
                    <div v-if="event.maxAttendees" class="mt-2">
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-600 dark:text-gray-400">
                          {{ event.maxAttendees - rsvpCounts(event).going }} spots remaining
                        </span>
                        <span class="text-gray-600 dark:text-gray-400">
                          {{ rsvpCounts(event).going }} / {{ event.maxAttendees }}
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          class="h-full rounded-full transition-all"
                          :class="{
                            'bg-green-500': (rsvpCounts(event).going / event.maxAttendees) < 0.5,
                            'bg-yellow-500': (rsvpCounts(event).going / event.maxAttendees) >= 0.5 && (rsvpCounts(event).going / event.maxAttendees) < 0.8,
                            'bg-orange-500': (rsvpCounts(event).going / event.maxAttendees) >= 0.8 && (rsvpCounts(event).going / event.maxAttendees) < 1,
                            'bg-red-500': (rsvpCounts(event).going / event.maxAttendees) >= 1
                          }"
                          :style="{ width: Math.min((rsvpCounts(event).going / event.maxAttendees) * 100, 100) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status Badge -->
              <div class="flex gap-2">
                <span
                  v-if="!event.approved"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Pending Approval
                </span>
                <span
                  v-if="new Date(event.date) < new Date()"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                >
                  Past Event
                </span>
              </div>

              <!-- Attendees List Section -->
              <div v-if="event.rsvps && event.rsvps.length > 0" class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <!-- Toggle Header -->
                <button
                  @click="toggleAttendees"
                  class="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <UserCheck class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span class="font-medium text-gray-900 dark:text-white">
                      View All Attendees ({{ event.rsvps.length }})
                    </span>
                  </div>
                  <svg
                    class="w-5 h-5 text-gray-500 transition-transform"
                    :class="{ 'rotate-180': showAttendees }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Attendees List -->
                <div
                  v-show="showAttendees"
                  class="max-h-64 overflow-y-auto bg-white dark:bg-gray-800"
                >
                  <!-- Going -->
                  <div v-if="attendeesByStatus.going.length > 0" class="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 mb-3">
                      <CheckCircle class="w-4 h-4 text-green-500" />
                      <h4 class="font-medium text-green-700 dark:text-green-400">
                        Going ({{ attendeesByStatus.going.length }})
                      </h4>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="rsvp in attendeesByStatus.going"
                        :key="rsvp.id"
                        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-2 rounded"
                      >
                        <Mail class="w-4 h-4 text-gray-400" />
                        <span>{{ rsvp.user?.email || 'Unknown' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Maybe -->
                  <div v-if="attendeesByStatus.maybe.length > 0" class="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 mb-3">
                      <HelpCircle class="w-4 h-4 text-yellow-500" />
                      <h4 class="font-medium text-yellow-700 dark:text-yellow-400">
                        Maybe ({{ attendeesByStatus.maybe.length }})
                      </h4>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="rsvp in attendeesByStatus.maybe"
                        :key="rsvp.id"
                        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
                      >
                        <Mail class="w-4 h-4 text-gray-400" />
                        <span>{{ rsvp.user?.email || 'Unknown' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Not Going -->
                  <div v-if="attendeesByStatus.notGoing.length > 0" class="p-4">
                    <div class="flex items-center gap-2 mb-3">
                      <XCircle class="w-4 h-4 text-gray-500" />
                      <h4 class="font-medium text-gray-700 dark:text-gray-400">
                        Not Going ({{ attendeesByStatus.notGoing.length }})
                      </h4>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="rsvp in attendeesByStatus.notGoing"
                        :key="rsvp.id"
                        class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20 p-2 rounded"
                      >
                        <Mail class="w-4 h-4 text-gray-400" />
                        <span>{{ rsvp.user?.email || 'Unknown' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div v-if="event.rsvps.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No attendees yet
                  </div>
                </div>
              </div>

              <!-- No RSVPs Message -->
              <div v-else class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <UserCheck class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  No RSVPs yet for this event
                </p>
              </div>

              <!-- Warning -->
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p class="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Deleting or editing this event will send email notifications to all {{ rsvpCounts(event).going + rsvpCounts(event).maybe }} attendees who have RSVPed.
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <!-- Approval Actions (only for pending events) -->
              <div v-if="!event.approved" class="flex gap-3 mb-3">
                <button
                  @click="handleApprove"
                  :disabled="loading"
                  class="flex-1 btn bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle class="w-4 h-4 mr-2" />
                  Approve Event
                </button>
                <button
                  @click="handleReject"
                  :disabled="loading"
                  class="flex-1 btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle class="w-4 h-4 mr-2" />
                  Reject Event
                </button>
              </div>

              <!-- Standard Actions -->
              <div class="flex gap-3">
                <button
                  @click="handleEdit"
                  :disabled="loading"
                  class="flex-1 btn bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pencil class="w-4 h-4 mr-2" />
                  Edit Event
                </button>
                <button
                  @click="handleDelete"
                  :disabled="loading"
                  class="flex-1 btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  Delete Event
                </button>
                <button
                  @click="handleClose"
                  :disabled="loading"
                  class="btn bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>

            <!-- Loading Overlay -->
            <div
              v-if="loading"
              class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center rounded-lg"
            >
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p class="text-gray-600 dark:text-gray-300">Processing...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
