import { Elysia, t } from "elysia";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/signup",
    async ({ body, set }) => {
      const result = await registerUser(body.email, body.password, body.role);
      set.status = result.status;
      
      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        message: result.message,
        user: result.user,
      };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Invalid email format",
        }),
        password: t.String({
          minLength: 6,
          error: "Password must be at least 6 characters long",
        }),
        role: t.Optional(t.Union([t.Literal("ATTENDEE"), t.Literal("ORGANIZER")], {
          default: "ATTENDEE",
        })),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Create a new user account with email, password, and optional role (ATTENDEE or ORGANIZER)",
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const result = await loginUser(body.email, body.password);
      set.status = result.status;

      if (!result.success) {
        return {
          error: result.error,
        };
      }

      return {
        message: result.message,
        token: result.token,
        user: result.user,
      };
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Invalid email format",
        }),
        password: t.String({
          minLength: 1,
          error: "Password is required",
        }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login user",
        description: "Authenticate user and receive JWT token",
      },
    }
  )
  .use(isAuthenticated)
  .get(
    "/me",
    async (ctx: any) => {
      // The user object is automatically attached to the context by isAuthenticated middleware
      return {
        user: ctx.user,
      };
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Get current user",
        description: "Get the authenticated user's profile information",
      },
    }
  );
