import { prisma } from "../db";
import { broadcastEventUpdate } from "../services/websocket.service";
import { queryEvents } from "../builders/event-query.builder";

/**
 * Get all approved events
 * @param userId - Optional user ID for filtering organizer's events
 * @param userRole - Optional user role to determine filtering logic
 * @returns List of approved events
 */
export async function getAllEvents(userId?: string, userRole?: string) {
  try {
    // Using Builder Pattern for cleaner, more maintainable query construction
    let query = queryEvents()
      .whereApproved()
      .includeOrganizer()
      .includeRSVPsWithUsers()
      .orderByDateAsc();

    // If user is ORGANIZER, show both approved and their pending events
    if (userRole === 'ORGANIZER' && userId) {
      query = queryEvents()
        .includeOrganizer()
        .includeRSVPsWithUsers()
        .whereOrganizer(userId)
        .orderByDateAsc();
    }
    // ADMIN sees all events (approved and pending) - handled separately
    // ATTENDEE sees only approved events

    const events = await query.findMany();

    return {
      success: true,
      events,
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      success: false,
      error: "Failed to fetch events",
      status: 500,
    };
  }
}

/**
 * Get all pending events (ADMIN only)
 * @returns List of pending events awaiting approval
 */
export async function getPendingEvents() {
  try {
    const events = await queryEvents()
      .wherePending()
      .includeOrganizer()
      .includeRSVPsWithUsers()
      .orderByCreatedDesc()
      .findMany();

    return {
      success: true,
      events,
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching pending events:", error);
    return {
      success: false,
      error: "Failed to fetch pending events",
      status: 500,
    };
  }
}

/**
 * Create a new event
 * @param userId - ID of the user creating the event (from ctx.user.id)
 * @param eventData - Event data (title, description, date, location)
 * @returns Created event
 */
export async function createEvent(
  userId: string,
  eventData: {
    title: string;
    description: string;
    date: Date;
    location: string;
  }
) {
  try {
    console.log("Attempting to create event with data:", { userId, eventData });
    const newEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        location: eventData.location,
        organizerId: userId, // Use organizerId from ctx.user.id
        approved: false, // Requires admin approval
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    console.log("Event created successfully (pending approval):", newEvent);

    // Broadcast the new event to connected clients
    broadcastEventUpdate({
      type: "EVENT_CREATED",
      data: {
        eventId: newEvent.id,
        event: newEvent,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      event: newEvent,
      message: "Event created successfully. Pending approval.",
      status: 201,
    };
  } catch (error) {
    console.error("Error creating event in controller:", error);
    return {
      success: false,
      error: "Failed to create event due to a server error.",
      status: 500,
    };
  }
}

/**
 * Update an event
 * @param eventId - ID of the event to update
 * @param userId - ID of the user updating the event (from ctx.user.id)
 * @param userRole - Role of the user (from ctx.user.role)
 * @param eventData - Updated event data
 * @returns Updated event
 */
export async function updateEvent(
  eventId: string,
  userId: string,
  userRole: string,
  eventData: {
    title?: string;
    description?: string;
    date?: Date;
    location?: string;
  }
) {
  try {
    // Find the event first
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
        status: 404,
      };
    }

    // Check if user is the organizer or an ADMIN
    if (event.organizerId !== userId && userRole !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Only the event organizer or admin can update this event.",
        status: 403,
      };
    }

    // Build a description of changes
    const changes: string[] = [];
    if (eventData.title && eventData.title !== event.title) {
      changes.push(`Title changed to: ${eventData.title}`);
    }
    if (eventData.description && eventData.description !== event.description) {
      changes.push(`Description updated`);
    }
    if (eventData.date && eventData.date.getTime() !== event.date.getTime()) {
      changes.push(`Date changed to: ${eventData.date.toLocaleString()}`);
    }
    if (eventData.location && eventData.location !== event.location) {
      changes.push(`Location changed to: ${eventData.location}`);
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: eventData,
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Get all RSVPs with user emails to send notifications
    if (changes.length > 0) {
      const rsvps = await prisma.rSVP.findMany({
        where: { eventId: eventId },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Send update notifications to all attendees (asynchronously)
      if (rsvps.length > 0) {
        const { sendEventUpdatedEmail } = await import("../services/email.service");
        
        const changesText = changes.join("; ");
        
        Promise.all(
          rsvps.map((rsvp) =>
            sendEventUpdatedEmail(
              rsvp.user.email,
              updatedEvent.title,
              updatedEvent.date,
              changesText
            ).catch((error) => {
              console.error(`Failed to send update email to ${rsvp.user.email}:`, error);
            })
          )
        ).then(() => {
          console.log(`📧 Sent update notifications to ${rsvps.length} attendee(s)`);
        });
      }
    }

    // Broadcast event update to WebSocket clients
    broadcastEventUpdate({
      type: "EVENT_UPDATED",
      data: {
        eventId: updatedEvent.id,
        event: updatedEvent,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      event: updatedEvent,
      message: "Event updated successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: "Failed to update event",
      status: 500,
    };
  }
}

/**
 * Delete an event
 * @param eventId - ID of the event to delete
 * @param userId - ID of the user deleting the event (from ctx.user.id)
 * @param userRole - Role of the user (from ctx.user.role)
 * @returns Success message
 */
export async function deleteEvent(
  eventId: string,
  userId: string,
  userRole: string
) {
  try {
    // Find the event first
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
        status: 404,
      };
    }

    // Check if user is the organizer or an ADMIN
    if (event.organizerId !== userId && userRole !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Only the event organizer or admin can delete this event.",
        status: 403,
      };
    }

    // Check if admin is deleting someone else's event
    const isAdminDeletingOrganizerEvent = 
      userRole === "ADMIN" && event.organizerId !== userId;

    // Get all RSVPs with user emails before deletion
    const rsvps = await prisma.rSVP.findMany({
      where: { eventId: eventId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    // Delete all RSVPs associated with the event
    await prisma.rSVP.deleteMany({
      where: { eventId: eventId },
    });

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

    // Send deletion notifications to all attendees (asynchronously)
    if (rsvps.length > 0) {
      const { sendEventDeletedEmail } = await import("../services/email.service");
      
      Promise.all(
        rsvps.map((rsvp) =>
          sendEventDeletedEmail(
            rsvp.user.email,
            event.title,
            event.date
          ).catch((error) => {
            console.error(`Failed to send deletion email to ${rsvp.user.email}:`, error);
          })
        )
      ).then(() => {
        console.log(`📧 Sent deletion notifications to ${rsvps.length} attendee(s)`);
      });
    }

    // If admin is deleting organizer's event, notify the organizer
    if (isAdminDeletingOrganizerEvent && event.organizer) {
      const { sendEventDeletedByAdminEmail } = await import("../services/email.service");
      
      sendEventDeletedByAdminEmail(
        event.organizer.email,
        event.title,
        event.date,
        "Your event was deleted by an administrator."
      ).catch((error) => {
        console.error(`Failed to send deletion notification to organizer:`, error);
      });
    }

    // Broadcast event deletion to WebSocket clients
    broadcastEventUpdate({
      type: "EVENT_DELETED",
      data: {
        eventId: eventId,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Event deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: "Failed to delete event",
      status: 500,
    };
  }
}

/**
 * Approve an event (Admin only)
 * @param eventId - ID of the event to approve
 * @returns Approved event
 */
export async function approveEvent(eventId: string) {
  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
        status: 404,
      };
    }

    // Update approved to true
    const approvedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        approved: true,
      },
      include: {
        organizer: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Broadcast event approval to WebSocket clients
    broadcastEventUpdate({
      type: "EVENT_APPROVED",
      data: {
        eventId: approvedEvent.id,
        event: approvedEvent,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      event: approvedEvent,
      message: "Event approved successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error approving event:", error);
    return {
      success: false,
      error: "Failed to approve event",
      status: 500,
    };
  }
}
