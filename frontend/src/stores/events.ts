import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import type { Event, RsvpStatus } from '../types'
import { useAuthStore } from './auth'
import WebSocketService from '../services/websocket'

/**
 * Events Store
 * Manages event data and real-time updates via WebSocket
 */
export const useEventsStore = defineStore('events', () => {
  const authStore = useAuthStore()
  // State
  const events = ref<Event[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const approvedEvents = computed(() => 
    events.value.filter(event => event.approved)
  )

  const upcomingEvents = computed(() => 
    approvedEvents.value.filter(event => new Date(event.date) >= new Date())
  )

  const pastEvents = computed(() => 
    approvedEvents.value.filter(event => new Date(event.date) < new Date())
  )

  /**
   * Fetch all events from API
   * For admins, also fetches pending events
   */
  async function fetchEvents() {
    loading.value = true
    error.value = null

    try {
      const response = await api.get('/events')
      let fetchedEvents = response.data.events || []
      
      // If user is admin, also fetch pending events
      if (authStore.userRole === 'ADMIN') {
        try {
          const pendingResponse = await api.get('/events/pending')
          const pendingEvents = pendingResponse.data.events || []
          // Combine approved and pending events
          fetchedEvents = [...fetchedEvents, ...pendingEvents]
        } catch (err: any) {
          console.warn('Failed to fetch pending events:', err)
          // Continue with just approved events if pending fetch fails
        }
      }
      
      // Remove duplicates based on event ID
      const uniqueEvents = Array.from(
        new Map(fetchedEvents.map((event: Event) => [event.id, event])).values()
      ) as Event[]
      
      events.value = uniqueEvents
    } catch (err: any) {
      console.error('Error fetching events:', err)
      error.value = err.response?.data?.error || 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new event
   */
  async function createEvent(eventData: {
    title: string
    description: string
    date: string
    location: string
    maxAttendees?: number | null
  }) {
    loading.value = true
    error.value = null

    try {
      const payload = {
        ...eventData,
        date: new Date(eventData.date).toISOString(),
      }
      const response = await api.post('/events', payload)
      const newEvent = response.data.event

      // Add to local state (only if WebSocket not connected or event doesn't exist)
      const exists = events.value.find(e => e.id === newEvent.id)
      if (!exists) {
        events.value.unshift(newEvent)
      }

      return newEvent
    } catch (err: any) {
      console.error('Error creating event:', err)
      error.value = err.response?.data?.error || 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing event
   */
  async function updateEvent(eventId: string, eventData: Partial<Event>) {
    loading.value = true
    error.value = null

    try {
      const response = await api.put(`/events/${eventId}`, eventData)
      const updatedEvent = response.data.event

      // Update local state immediately (optimistic update)
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        // Use splice to ensure Vue reactivity is triggered
        events.value.splice(index, 1, updatedEvent)
      }

      return updatedEvent
    } catch (err: any) {
      console.error('Error updating event:', err)
      error.value = err.response?.data?.error || 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete an event
   */
  async function deleteEvent(eventId: string) {
    loading.value = true
    error.value = null

    try {
      await api.delete(`/events/${eventId}`)

      // Remove from local state
      events.value = events.value.filter(e => e.id !== eventId)
    } catch (err: any) {
      console.error('Error deleting event:', err)
      error.value = err.response?.data?.error || 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Approve an event (ADMIN only)
   */
  async function approveEvent(eventId: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.put(`/events/${eventId}/approve`)
      const approvedEvent = response.data.event

      // Update local state
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value.splice(index, 1, approvedEvent)
      }

      return approvedEvent
    } catch (err: any) {
      console.error('Error approving event:', err)
      error.value = err.response?.data?.error || 'Failed to approve event'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * RSVP to an event
   */
  async function rsvpToEvent(eventId: string, status: RsvpStatus) {
    try {
      const response = await api.post(`/events/${eventId}/rsvp`, { status })
      const rsvp = response.data.rsvp

      // Update local event with new RSVP
      const event = events.value.find(e => e.id === eventId)
      if (event) {
        if (!event.rsvps) {
          event.rsvps = []
        }
        
        // Update or add RSVP
        const existingIndex = event.rsvps.findIndex(r => r.userId === rsvp.userId)
        if (existingIndex !== -1) {
          event.rsvps[existingIndex] = rsvp
        } else {
          event.rsvps.push(rsvp)
        }
      }

      return rsvp
    } catch (err: any) {
      console.error('Error RSVPing to event:', err)
      error.value = err.response?.data?.error || 'Failed to RSVP'
      throw err
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  function connectWebSocket() {
    // Register message handler for WebSocket updates
    WebSocketService.addMessageHandler(handleWebSocketMessage)

    // Connect to WebSocket
    WebSocketService.connect()
  }

  /**
   * Handle WebSocket messages
   */
  function handleWebSocketMessage(message: any) {
    console.log('📨 WebSocket message:', message)

    switch (message.type) {
      case 'EVENT_CREATED':
        // Add new event to list (prevent duplicates)
        if (message.data.event) {
          const exists = events.value.find(e => e.id === message.data.event.id)
          if (!exists) {
            events.value.unshift(message.data.event)
          }
        }
        break

      case 'EVENT_UPDATED':
      case 'EVENT_APPROVED':
        // Update existing event
        if (message.data.event) {
          const index = events.value.findIndex(e => e.id === message.data.event.id)
          if (index !== -1) {
            // Use splice to ensure Vue reactivity
            events.value.splice(index, 1, message.data.event)
            console.log('✅ Event updated via WebSocket:', message.data.event.title)
          } else {
            console.log('⚠️ Event not found in local state, adding it')
            events.value.unshift(message.data.event)
          }
        }
        break

      case 'EVENT_DELETED':
        // Remove event from list
        events.value = events.value.filter(e => e.id !== message.data.eventId)
        break

      case 'RSVP_CREATED':
      case 'RSVP_UPDATED':
        // Update RSVP in event
        if (message.data.rsvp) {
          const event = events.value.find(e => e.id === message.data.eventId)
          if (event) {
            if (!event.rsvps) {
              event.rsvps = []
            }
            
            const existingIndex = event.rsvps.findIndex(r => r.userId === message.data.userId)
            if (existingIndex !== -1) {
              event.rsvps[existingIndex] = message.data.rsvp
            } else {
              event.rsvps.push(message.data.rsvp)
            }
          }
        }
        break

      case 'RSVP_DELETED':
        // Remove RSVP from event
        const event = events.value.find(e => e.id === message.data.eventId)
        if (event && event.rsvps) {
          event.rsvps = event.rsvps.filter(r => r.userId !== message.data.userId)
        }
        break
    }
  }

  /**
   * Disconnect WebSocket
   */
  function disconnectWebSocket() {
    // Remove message handler
    WebSocketService.removeMessageHandler(handleWebSocketMessage)

    // Disconnect WebSocket
    WebSocketService.disconnect()
  }

  return {
    // State
    events,
    loading,
    error,

    // Getters
    approvedEvents,
    upcomingEvents,
    pastEvents,

    // Actions
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
    approveEvent,
    connectWebSocket,
    disconnectWebSocket,
  }
})
