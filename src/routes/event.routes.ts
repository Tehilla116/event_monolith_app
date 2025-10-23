import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
} from "../controllers/event.controller";
import { rsvpToEvent } from "../controllers/rsvp.controller";
import { isAuthenticated, isRole } from "../middleware/auth.middleware";
import { prisma } from "../db";

export const eventRoutes = new Elysia({ prefix: "/events" })
  // GET /events - Get all approved events (all users)
  .get(
    "/",
    async ({ set }) => {
      const result = await getAllEvents();
      set.status = result.status;

      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        events: result.events,
      };
    },
    {
      detail: {
        tags: ["Events"],
        summary: "Get all approved events",
        description: "Retrieve a list of all approved events",
      },
    }
  )
  // POST /events - Create new event (ORGANIZER only)
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "default-secret-key",
    })
  )
  .post(
    "/",
    async ({ headers, set, body, jwt }: any) => {
      console.log("📝 Received event creation request");
      console.log("Body:", body);
      
      // Manual authentication
      const authHeader = headers.authorization;
      
      if (!authHeader) {
        set.status = 401;
        return { error: "Authorization header is required" };
      }

      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        set.status = 401;
        return { error: "Invalid Authorization header format" };
      }

      const token = parts[1];
      
      try {
        const payload = await jwt.verify(token);
        
        if (!payload) {
          set.status = 401;
          return { error: "Invalid or expired token" };
        }

        const userId = payload.sub || payload.userId;
        
        if (!userId) {
          set.status = 401;
          return { error: "Invalid token payload" };
        }

        const user = await prisma.user.findUnique({
          where: { id: userId as string },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        if (!user) {
          set.status = 401;
          return { error: "User not found" };
        }

        console.log("User:", user);

        if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Access denied. Required role: ORGANIZER or ADMIN" };
        }

        // Create event
        const result = await createEvent(user.id, {
          title: body.title,
          description: body.description,
          date: new Date(body.date),
          location: body.location,
        });
        
        set.status = result.status;

        if (!result.success) {
          console.error("❌ Event creation failed:", result.error);
          return {
            error: result.error,
          };
        }

        console.log("✅ Event created successfully:", result.event?.id);
        return {
          message: result.message,
          event: result.event,
        };
      } catch (error) {
        console.error("🚨 Error in event creation:", error);
        set.status = 401;
        return { error: "Token verification failed" };
      }
    },
    {
      body: t.Object({
        title: t.String({
          minLength: 3,
          error: "Title must be at least 3 characters",
        }),
        description: t.String({
          minLength: 10,
          error: "Description must be at least 10 characters",
        }),
        date: t.String({
          error: "A valid date string is required",
        }),
        location: t.String({
          minLength: 3,
          error: "Location must be at least 3 characters",
        }),
      }),
      detail: {
        tags: ["Events"],
        summary: "Create a new event (ORGANIZER only)",
        description: "Create a new event. Requires ORGANIZER role.",
      },
    }
  )
  // PUT /events/:id - Update event (ORGANIZER or ADMIN)
  .use(isAuthenticated)
  .use(isRole(["ORGANIZER", "ADMIN"]))
  .put(
    "/:id",
    async (ctx: any) => {
      const updateData: any = {};
      if (ctx.body.title) updateData.title = ctx.body.title;
      if (ctx.body.description) updateData.description = ctx.body.description;
      if (ctx.body.date) updateData.date = new Date(ctx.body.date);
      if (ctx.body.location) updateData.location = ctx.body.location;

      const result = await updateEvent(
        ctx.params.id,
        ctx.user.id,
        ctx.user.role,
        updateData
      );
      ctx.set.status = result.status;

      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        message: result.message,
        event: result.event,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        title: t.Optional(t.String({ minLength: 3 })),
        description: t.Optional(t.String({ minLength: 10 })),
        date: t.Optional(t.String()),
        location: t.Optional(t.String({ minLength: 3 })),
      }),
      detail: {
        tags: ["Events"],
        summary: "Update an event (ORGANIZER or ADMIN)",
        description: "Update an event. Only the organizer or admin can update.",
      },
    }
  )
  // DELETE /events/:id - Delete event (ORGANIZER or ADMIN)
  .use(isAuthenticated)
  .use(isRole(["ORGANIZER", "ADMIN"]))
  .delete(
    "/:id",
    async (ctx: any) => {
      const result = await deleteEvent(ctx.params.id, ctx.user.id, ctx.user.role);
      ctx.set.status = result.status;

      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        message: result.message,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Events"],
        summary: "Delete an event (ORGANIZER or ADMIN)",
        description: "Delete an event. Only the organizer or admin can delete.",
      },
    }
  )
  // PUT /events/:id/approve - Approve event (ADMIN only)
  .use(isAuthenticated)
  .use(isRole(["ADMIN"]))
  .put(
    "/:id/approve",
    async ({ params, set }) => {
      const result = await approveEvent(params.id);
      set.status = result.status;

      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        message: result.message,
        event: result.event,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Events"],
        summary: "Approve an event (ADMIN only)",
        description: "Approve an event for public viewing. Requires ADMIN role.",
      },
    }
  )
  // POST /events/:id/rsvp - RSVP to event (ATTENDEE only)
  .post(
    "/:id/rsvp",
    async ({ headers, set, params, body, jwt }: any) => {
      console.log("📝 Received RSVP request for event:", params.id);
      
      // Manual authentication
      const authHeader = headers.authorization;
      
      if (!authHeader) {
        set.status = 401;
        return { error: "Authorization header is required" };
      }

      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        set.status = 401;
        return { error: "Invalid Authorization header format" };
      }

      const token = parts[1];
      
      try {
        const payload = await jwt.verify(token);
        
        if (!payload) {
          set.status = 401;
          return { error: "Invalid or expired token" };
        }

        const userId = payload.sub || payload.userId;
        
        if (!userId) {
          set.status = 401;
          return { error: "Invalid token payload" };
        }

        const user = await prisma.user.findUnique({
          where: { id: userId as string },
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });

        if (!user) {
          set.status = 401;
          return { error: "User not found" };
        }

        console.log("User RSVPing:", user.email);

        // Note: Removing ATTENDEE-only restriction so any logged-in user can RSVP
        // if (user.role !== "ATTENDEE") {
        //   set.status = 403;
        //   return { error: "Access denied. Required role: ATTENDEE" };
        // }

        // Create/update RSVP
        const result = await rsvpToEvent(params.id, user.id, body.status);
        set.status = result.status;

        if (!result.success) {
          console.error("❌ RSVP failed:", result.error);
          return {
            error: result.error,
          };
        }

        console.log("✅ RSVP successful");
        return {
          message: result.message,
          rsvp: result.rsvp,
        };
      } catch (error) {
        console.error("🚨 Error in RSVP:", error);
        set.status = 401;
        return { error: "Token verification failed" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Union([
          t.Literal("GOING"),
          t.Literal("MAYBE"),
          t.Literal("NOT_GOING"),
        ]),
      }),
      detail: {
        tags: ["Events"],
        summary: "RSVP to an event",
        description: "Create or update RSVP for an event. Requires authentication.",
      },
    }
  );
