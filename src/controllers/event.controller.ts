import { prisma } from "../db";
import { broadcastEventUpdate } from "../services/websocket.service";

/**
 * Get all approved events
 * @returns List of approved events
 */
export async function getAllEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
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
        rsvps: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

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
    const newEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        location: eventData.location,
        organizerId: userId, // Use organizerId from ctx.user.id
        approved: false, // Events need approval by default
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

    // Broadcast event creation to WebSocket clients
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
    console.error("Error creating event:", error);
    return {
      success: false,
      error: "Failed to create event",
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

    // Delete the event
    await prisma.event.delete({
      where: { id: eventId },
    });

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
