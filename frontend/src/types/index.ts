/**
 * TypeScript Type Definitions
 * Shared types for the Event Management Application
 */

/**
 * User roles
 */
export type UserRole = 'ADMIN' | 'ORGANIZER' | 'ATTENDEE'

/**
 * RSVP status
 */
export type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING'

/**
 * User interface
 */
export interface User {
  id: string
  email: string
  role: UserRole
  createdAt?: string
}

/**
 * RSVP interface
 */
export interface RSVP {
  id: string
  userId: string
  eventId: string
  status: RsvpStatus
  createdAt?: string
  updatedAt?: string
  user?: User
}

/**
 * Event interface
 */
export interface Event {
  id: string
  title: string
  description: string
  date: string
  location: string
  organizerId: string
  approved: boolean
  createdAt?: string
  updatedAt?: string
  organizer?: User
  rsvps?: RSVP[]
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * WebSocket message types
 */
export interface EventUpdateMessage {
  type: 'EVENT_CREATED' | 'EVENT_UPDATED' | 'EVENT_DELETED' | 'EVENT_APPROVED'
  data: {
    eventId: string
    event?: Event
    timestamp: string
  }
}

export interface RsvpUpdateMessage {
  type: 'RSVP_CREATED' | 'RSVP_UPDATED' | 'RSVP_DELETED'
  data: {
    eventId: string
    userId: string
    status?: RsvpStatus
    rsvp?: RSVP
    timestamp: string
  }
}

export type WebSocketMessage = EventUpdateMessage | RsvpUpdateMessage
