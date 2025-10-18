# Event Management Application

A full-stack monolith event management application built with Elysia.js and TypeScript.

## Tech Stack

- **Framework**: Elysia.js
- **Database**: Prisma with PostgreSQL (Neon)
- **Auth**: Manual JWT (jsonwebtoken + bcryptjs) with role-based access control
- **Realtime**: Elysia.js built-in WebSockets
- **Email**: Nodemailer with Ethereal for mock emails
- **Docs**: @elysiajs/swagger

## Project Structure

```
src/
├── controllers/       # auth.controller.ts, event.controller.ts, rsvp.controller.ts
├── middleware/        # auth.middleware.ts
├── routes/            # auth.routes.ts, event.routes.ts
├── services/          # email.service.ts, websocket.service.ts
├── utils/             # jwt.utils.ts
├── prisma/
│   └── schema.prisma
└── index.ts           # Main server entry
```

## Setup Instructions

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your actual values:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` with your Neon PostgreSQL connection string.

### 3. Setup Database

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database
bun run db:push

# Or run migrations (for production)
bun run db:migrate
```

### 4. Run Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`

## API Documentation

Once the server is running, visit `http://localhost:3000/swagger` for interactive API documentation.

## Available Scripts

- `bun run dev` - Start development server with auto-reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate Prisma Client
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Prisma Studio

## Features

- ✅ User authentication with JWT
- ✅ Role-based access control (USER, ADMIN)
- ✅ Event management (CRUD operations)
- ✅ RSVP system with status tracking
- ✅ Real-time updates via WebSockets
- ✅ Email notifications
- ✅ Swagger API documentation

## Next Steps

The basic setup is complete! You can now:

1. Install dependencies: `bun install`
2. Set up your `.env` file with database credentials
3. Generate Prisma client and push the schema
4. Start implementing controllers, routes, and services

Ask me to generate any specific part of the application!
