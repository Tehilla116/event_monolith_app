import { Elysia, t } from "elysia";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
} from "../controllers/event.controller";
import { rsvpToEvent } from "../controllers/rsvp.controller";
import { isAuthenticated, isRole } from "../middleware/auth.middleware";

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
  .use(isAuthenticated)
  .use(isRole(["ORGANIZER"]))
  .post(
    "/",
    async (ctx: any) => {
      const result = await createEvent(ctx.user.id, {
        title: ctx.body.title,
        description: ctx.body.description,
        date: new Date(ctx.body.date),
        location: ctx.body.location,
      });
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
          format: "date-time",
          error: "Invalid date format. Use ISO 8601 format",
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
        date: t.Optional(t.String({ format: "date-time" })),
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
  .use(isAuthenticated)
  .use(isRole(["ATTENDEE"]))
  .post(
    "/:id/rsvp",
    async (ctx: any) => {
      const result = await rsvpToEvent(ctx.params.id, ctx.user.id, ctx.body.status);
      ctx.set.status = result.status;

      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        message: result.message,
        rsvp: result.rsvp,
      };
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
        summary: "RSVP to an event (ATTENDEE only)",
        description: "Create or update RSVP for an event. Requires ATTENDEE role.",
      },
    }
  );
