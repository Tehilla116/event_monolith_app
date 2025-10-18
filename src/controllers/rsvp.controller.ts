import { prisma } from "../db";
import { broadcastRsvpUpdate } from "../services/websocket.service";

/**
 * RSVP to an event
 * Creates or updates an RSVP for a user to an event
 * @param eventId - ID of the event to RSVP to
 * @param userId - ID of the user (from ctx.user.id)
 * @param status - RSVP status: GOING, MAYBE, or NOT_GOING
 * @returns Created or updated RSVP
 */
export async function rsvpToEvent(
  eventId: string,
  userId: string,
  status: "GOING" | "MAYBE" | "NOT_GOING"
) {
  try {
    // Check if event exists and is approved
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

    if (!event.approved) {
      return {
        success: false,
        error: "Cannot RSVP to an unapproved event",
        status: 400,
      };
    }

    // Use upsert to create or update RSVP
    // The @@unique([userId, eventId]) constraint ensures one RSVP per user per event
    const rsvp = await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: eventId,
        },
      },
      update: {
        status: status,
      },
      create: {
        userId: userId,
        eventId: eventId,
        status: status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
          },
        },
      },
    });

    const isNewRsvp = rsvp.createdAt.getTime() === new Date().getTime();
    const message = isNewRsvp
      ? `RSVP created successfully with status: ${status}`
      : `RSVP updated successfully to: ${status}`;

    // Broadcast RSVP update to WebSocket clients
    broadcastRsvpUpdate({
      type: isNewRsvp ? "RSVP_CREATED" : "RSVP_UPDATED",
      data: {
        eventId: rsvp.eventId,
        userId: rsvp.userId,
        status: rsvp.status,
        rsvp: rsvp,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      rsvp,
      message,
      status: isNewRsvp ? 201 : 200,
    };
  } catch (error) {
    console.error("Error creating/updating RSVP:", error);
    return {
      success: false,
      error: "Failed to RSVP to event",
      status: 500,
    };
  }
}

/**
 * Get user's RSVPs
 * @param userId - ID of the user (from ctx.user.id)
 * @returns List of user's RSVPs
 */
export async function getUserRsvps(userId: string) {
  try {
    const rsvps = await prisma.rSVP.findMany({
      where: {
        userId: userId,
      },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      rsvps,
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching user RSVPs:", error);
    return {
      success: false,
      error: "Failed to fetch RSVPs",
      status: 500,
    };
  }
}

/**
 * Get RSVPs for an event
 * @param eventId - ID of the event
 * @returns List of RSVPs for the event
 */
export async function getEventRsvps(eventId: string) {
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

    const rsvps = await prisma.rSVP.findMany({
      where: {
        eventId: eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count RSVPs by status
    const summary = {
      going: rsvps.filter((r) => r.status === "GOING").length,
      maybe: rsvps.filter((r) => r.status === "MAYBE").length,
      notGoing: rsvps.filter((r) => r.status === "NOT_GOING").length,
      total: rsvps.length,
    };

    return {
      success: true,
      rsvps,
      summary,
      status: 200,
    };
  } catch (error) {
    console.error("Error fetching event RSVPs:", error);
    return {
      success: false,
      error: "Failed to fetch event RSVPs",
      status: 500,
    };
  }
}

/**
 * Delete an RSVP
 * @param eventId - ID of the event
 * @param userId - ID of the user (from ctx.user.id)
 * @returns Success message
 */
export async function deleteRsvp(eventId: string, userId: string) {
  try {
    // Check if RSVP exists
    const rsvp = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: eventId,
        },
      },
    });

    if (!rsvp) {
      return {
        success: false,
        error: "RSVP not found",
        status: 404,
      };
    }

    // Delete the RSVP
    await prisma.rSVP.delete({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: eventId,
        },
      },
    });

    // Broadcast RSVP deletion to WebSocket clients
    broadcastRsvpUpdate({
      type: "RSVP_DELETED",
      data: {
        eventId: eventId,
        userId: userId,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "RSVP deleted successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Error deleting RSVP:", error);
    return {
      success: false,
      error: "Failed to delete RSVP",
      status: 500,
    };
  }
}
