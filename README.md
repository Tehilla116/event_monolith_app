# Event Management Application

A modern full-stack monolith event management application with real-time updates, email notifications, and professional design patterns.

## 🚀 Tech Stack

### Backend
- **Framework**: Elysia.js with TypeScript
- **Database**: Prisma ORM with PostgreSQL (Neon)
- **Authentication**: JWT with role-based access control (ADMIN, ORGANIZER, ATTENDEE)
- **Real-time**: WebSocket for live event updates
- **Email**: Nodemailer with multi-provider support (Ethereal, SendGrid, AWS SES, SMTP)
- **API Docs**: @elysiajs/swagger

### Frontend
- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia stores
- **Styling**: Tailwind CSS with custom components
- **HTTP Client**: Axios
- **Router**: Vue Router

### Design Patterns
- **Factory Pattern** - Email template generation
- **Builder Pattern** - Complex query construction
- **Command Pattern** - Audit trail and undo/redo
- **Adapter Pattern** - Email provider abstraction
- **Singleton Pattern** - Command history, WebSocket service
- **Observer Pattern** - Real-time event updates
- **Repository Pattern** - Data access layer

## 📁 Project Structure

```
event_monolith_app/
├── frontend/                 # Vue.js frontend application
│   ├── src/
│   │   ├── components/       # Reusable Vue components
│   │   │   ├── AdminActionsModal.vue
│   │   │   ├── ConfirmModal.vue
│   │   │   ├── CreateEventModal.vue
│   │   │   ├── EventCard.vue
│   │   │   ├── LoadingSpinner.vue
│   │   │   ├── Navbar.vue
│   │   │   └── Toast.vue
│   │   ├── layouts/          # Layout components
│   │   ├── router/           # Vue Router configuration
│   │   ├── services/         # API and WebSocket clients
│   │   ├── stores/           # Pinia state management
│   │   ├── types/            # TypeScript interfaces
│   │   └── views/            # Page components
│   └── package.json
│
├── src/                      # Backend application
│   ├── adapters/             # Email provider adapters
│   │   └── email.adapter.ts
│   ├── builders/             # Query builders
│   │   └── event-query.builder.ts
│   ├── controllers/          # Business logic
│   │   ├── auth.controller.ts
│   │   ├── event.controller.ts
│   │   └── rsvp.controller.ts
│   ├── factories/            # Object factories
│   │   └── email.factory.ts
│   ├── middleware/           # Express-style middleware
│   │   └── auth.middleware.ts
│   ├── patterns/             # Design pattern implementations
│   │   └── command.pattern.ts
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts
│   │   └── event.routes.ts
│   ├── services/             # Core services
│   │   ├── email.service.ts
│   │   └── websocket.service.ts
│   ├── utils/                # Helper functions
│   │   └── jwt.utils.ts
│   ├── examples/             # Pattern usage examples
│   │   └── pattern-examples.ts
│   ├── db.ts                 # Prisma client
│   └── index.ts              # Server entry point
│
├── prisma/
│   └── schema.prisma         # Database schema
│
├── scripts/
│   └── create-admin.ts       # Admin user creation script
│
├── DESIGN_PATTERNS.md        # Comprehensive pattern documentation
├── IMPLEMENTATION_SUMMARY.md # Implementation overview
└── package.json
```

## 🚀 Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
bun install
```

**Frontend:**
```bash
cd frontend
npm install
# or
bun install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT
JWT_SECRET="your-secret-key-here"

# Email Provider (ethereal | sendgrid | aws | smtp)
EMAIL_PROVIDER=ethereal

# Optional: SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Optional: AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional: Custom SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### 3. Setup Database

```bash
# Generate Prisma Client
bun run db:generate

# Push schema to database (development)
bun run db:push

# Or run migrations (production)
bun run db:migrate
```

### 4. Create Admin User (Optional)

```bash
bun run scripts/create-admin.ts
```

### 5. Run Development Servers

**Backend (Terminal 1):**
```bash
bun run dev
```
Server runs at `http://localhost:8080`

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
# or
bun run dev
```
Frontend runs at `http://localhost:5173`

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8080/swagger`
- **Interactive API docs** with request/response examples

## 📜 Available Scripts

### Backend
- `bun run dev` - Start development server with auto-reload
- `bun run start` - Start production server
- `bun run db:generate` - Generate Prisma Client
- `bun run db:push` - Push schema changes to database
- `bun run db:migrate` - Run database migrations
- `bun run db:studio` - Open Prisma Studio
- `bun run scripts/create-admin.ts` - Create admin user

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (ADMIN, ORGANIZER, ATTENDEE)
- ✅ Protected routes and API endpoints
- ✅ User registration and login

### Event Management
- ✅ Create, read, update, delete events
- ✅ Event approval workflow (ADMIN only)
- ✅ Event search and filtering
- ✅ Date and location management
- ✅ Organizer assignment

### RSVP System
- ✅ RSVP to events (CONFIRMED, DECLINED, PENDING)
- ✅ View attendee lists
- ✅ RSVP status tracking
- ✅ Automatic capacity management

### Real-time Features
- ✅ WebSocket connection for live updates
- ✅ Real-time event creation notifications
- ✅ Real-time event updates and deletions
- ✅ Instant RSVP updates

### Email Notifications
- ✅ Welcome emails on registration
- ✅ Event creation confirmations
- ✅ Event update notifications
- ✅ Event deletion alerts
- ✅ RSVP confirmations
- ✅ Event reminders
- ✅ Multi-provider support (Ethereal, SendGrid, AWS SES, SMTP)

### UI/UX
- ✅ Responsive design with Tailwind CSS
- ✅ Toast notifications (success, error, warning, info)
- ✅ Custom confirmation modals
- ✅ Loading states and spinners
- ✅ Admin dashboard with event management
- ✅ Event cards with RSVP functionality
- ✅ Modal-based event creation/editing

### Architecture & Design Patterns
- ✅ **Factory Pattern** - Centralized email template creation
- ✅ **Builder Pattern** - Fluent API for complex queries
- ✅ **Command Pattern** - Audit trail with undo/redo
- ✅ **Adapter Pattern** - Email provider abstraction
- ✅ **Singleton Pattern** - Shared service instances
- ✅ **Observer Pattern** - WebSocket event broadcasting
- ✅ **Repository Pattern** - Data access abstraction

## 🎯 Usage Examples

### Using the Builder Pattern
```typescript
import { queryEvents } from './builders/event-query.builder';

// Complex query with fluent API
const events = await queryEvents()
  .whereApproved()
  .whereUpcoming()
  .includeRSVPsWithUsers()
  .orderByDateAsc()
  .paginate(1, 10)
  .findMany();
```

### Using the Factory Pattern
```typescript
import { EmailFactory } from './factories/email.factory';
import { createEmailService } from './adapters/email.adapter';

// Create email with consistent template
const emailService = createEmailService();
const mailOptions = EmailFactory.createWelcomeEmail('user@example.com');
await emailService.send(mailOptions);
```

### Using the Command Pattern
```typescript
import { CreateEventCommand, CommandHistory } from './patterns/command.pattern';

// Execute command with automatic audit logging
const command = new CreateEventCommand(userId, eventData);
const event = await command.execute();

// View audit trail
const history = CommandHistory.getInstance().getUserHistory(userId);

// Undo last operation
await CommandHistory.getInstance().undoLast();
```

### Using the Adapter Pattern
```typescript
import { createEmailService } from './adapters/email.adapter';

// Automatically uses provider from EMAIL_PROVIDER env variable
const emailService = createEmailService();

// Or switch provider at runtime
import { SendGridAdapter } from './adapters/email.adapter';
emailService.setAdapter(new SendGridAdapter(apiKey));
```

## 📖 Documentation

- **[DESIGN_PATTERNS.md](./DESIGN_PATTERNS.md)** - Comprehensive guide to all design patterns used
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Quick reference and implementation overview
- **[src/examples/pattern-examples.ts](./src/examples/pattern-examples.ts)** - Working code examples

## 🔧 Configuration

### Email Provider Setup

The application supports multiple email providers. Configure via the `EMAIL_PROVIDER` environment variable:

#### Ethereal (Development/Testing)
```env
EMAIL_PROVIDER=ethereal
```
- No additional configuration needed
- Automatically creates test accounts
- Generates preview URLs for emails
- Perfect for development

#### SendGrid
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-api-key
```

#### AWS SES
```env
EMAIL_PROVIDER=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

#### Custom SMTP
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## 🎨 Frontend Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Real-time Updates** - See changes instantly via WebSocket
- **Toast Notifications** - Beautiful success/error/warning messages
- **Modal Dialogs** - Smooth animations and user-friendly forms
- **Loading States** - Spinners and skeleton screens
- **Admin Dashboard** - Manage events with attendee viewer
- **Event Cards** - Interactive cards with RSVP buttons
- **Confirmation Dialogs** - Custom styled confirmation modals

## 🔐 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access: approve events, view all events, manage all RSVPs |
| **ORGANIZER** | Create events, edit own events, view attendees |
| **ATTENDEE** | View approved events, RSVP to events |

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(ATTENDEE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Event {
  id          String   @id @default(cuid())
  title       String
  description String
  date        DateTime
  location    String
  organizerId String
  approved    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RSVP {
  id        String     @id @default(cuid())
  userId    String
  eventId   String
  status    RSVPStatus @default(PENDING)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}
```

## 🚀 Deployment

### Backend
- **Platform**: Can be deployed to any Node.js hosting (Vercel, Railway, Render, etc.)
- **Database**: Neon PostgreSQL (serverless)
- **Environment**: Set all required environment variables

### Frontend
- **Platform**: Vercel, Netlify, or any static hosting
- **Build**: `npm run build` generates optimized static files
- **Environment**: Update API base URL in `frontend/src/services/api.ts`

## 🧪 Testing

### View Ethereal Emails
When an email is sent in development:
1. Check the backend terminal output
2. Look for lines starting with `📧`
3. Find the `Preview URL: https://ethereal.email/message/...`
4. Click the URL to view the email in your browser

### Test WebSocket Connection
Open `websocket-test.html` in your browser to test real-time updates.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all approved events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (ORGANIZER/ADMIN)
- `PUT /api/events/:id` - Update event (ORGANIZER/ADMIN)
- `DELETE /api/events/:id` - Delete event (ORGANIZER/ADMIN)
- `POST /api/events/:id/approve` - Approve event (ADMIN only)

### RSVPs
- `POST /api/events/:id/rsvp` - RSVP to event
- `GET /api/events/:id/attendees` - Get event attendees

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Elysia.js](https://elysiajs.com/)
- UI powered by [Vue.js](https://vuejs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Database management with [Prisma](https://www.prisma.io/)

---

**Made with ❤️ using modern design patterns and best practices**

