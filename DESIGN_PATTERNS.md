# Design Patterns Implementation Guide

This document explains the design patterns implemented in the Event Management Application codebase.

## 📚 Table of Contents

1. [Factory Pattern](#1-factory-pattern)
2. [Builder Pattern](#2-builder-pattern)
3. [Command Pattern](#3-command-pattern)
4. [Adapter Pattern](#4-adapter-pattern)

---

## 1. Factory Pattern

### 📁 Location
`src/factories/email.factory.ts`

### 🎯 Purpose
Centralizes email template creation, ensuring consistency and maintainability. The factory creates different types of email configurations without exposing the template creation logic.

### 💡 Usage Example

```typescript
import { EmailFactory } from '../factories/email.factory';
import { initializeTransporter } from '../services/email.service';

// Create a welcome email
const mailOptions = EmailFactory.createWelcomeEmail('user@example.com');
const transport = await initializeTransporter();
await transport.sendMail(mailOptions);

// Create event deleted notification
const deleteEmail = EmailFactory.createEventDeletedEmail(
  'user@example.com',
  'Summer Festival',
  new Date('2025-07-15')
);
await transport.sendMail(deleteEmail);

// Create event updated notification
const updateEmail = EmailFactory.createEventUpdatedEmail(
  'user@example.com',
  'Summer Festival',
  new Date('2025-07-15'),
  'Date changed to July 20th; Location updated to Central Park'
);
await transport.sendMail(updateEmail);
```

### ✅ Benefits
- **Consistency**: All emails follow the same visual template
- **Maintainability**: Change email design in one place
- **Testability**: Easy to test email generation separately from sending
- **Extensibility**: Add new email types easily

### 🔧 Available Methods
- `createWelcomeEmail(email)` - New user registration
- `createEventDeletedEmail(email, title, date)` - Event cancellation
- `createEventUpdatedEmail(email, title, date, changes)` - Event modifications
- `createEventReminderEmail(email, title, date, location)` - Upcoming event reminder
- `createRsvpConfirmationEmail(email, title, date, location, status)` - RSVP confirmation

---

## 2. Builder Pattern

### 📁 Location
`src/builders/event-query.builder.ts`

### 🎯 Purpose
Provides a fluent, readable interface for constructing complex Prisma queries. Eliminates deeply nested query objects and improves code readability.

### 💡 Usage Example

```typescript
import { queryEvents } from '../builders/event-query.builder';

// Simple query - Get approved upcoming events
const upcomingEvents = await queryEvents()
  .whereApproved()
  .whereUpcoming()
  .includeOrganizer()
  .includeRSVPs()
  .orderByDateAsc()
  .findMany();

// Complex query with pagination
const searchResults = await queryEvents()
  .whereApproved()
  .whereSearch('music')
  .whereLocation('New York')
  .includersVPsWithUsers()
  .orderByDateDesc()
  .paginate(1, 20)
  .findMany();

// Count matching events
const eventCount = await queryEvents()
  .whereOrganizer(userId)
  .whereUpcoming()
  .count();

// Check if any events exist
const hasEvents = await queryEvents()
  .whereDateRange(startDate, endDate)
  .exists();
```

### ✅ Benefits
- **Readability**: Self-documenting query construction
- **Reusability**: Chain methods for different query combinations
- **Type Safety**: Full TypeScript support with Prisma types
- **Debugging**: Easy to log query configuration with `getQuery()`

### 🔧 Available Methods

**Filtering**:
- `whereApproved()` - Only approved events
- `wherePending()` - Only pending events
- `whereUpcoming()` - Future events
- `wherePast()` - Past events
- `whereOrganizer(userId)` - By organizer
- `whereDateRange(start, end)` - Date range
- `whereSearch(term)` - Search title/description
- `whereLocation(location)` - By location

**Includes**:
- `includeOrganizer()` - Include organizer info
- `includeRSVPs()` - Include RSVP data
- `includeRSVPsWithUsers()` - Include RSVPs with user details

**Ordering**:
- `orderByDateAsc()` - Oldest first
- `orderByDateDesc()` - Newest first
- `orderByCreatedDesc()` - Recently created first
- `orderByTitle()` - Alphabetical

**Pagination**:
- `limit(count)` - Limit results
- `skip(count)` - Skip results
- `paginate(page, size)` - Convenience pagination

**Execution**:
- `findMany()` - Get all matching events
- `findFirst()` - Get first matching event
- `count()` - Count matching events
- `exists()` - Check if any exist

---

## 3. Command Pattern

### 📁 Location
`src/patterns/command.pattern.ts`

### 🎯 Purpose
Encapsulates operations as objects, enabling audit logging, undo/redo functionality, and operation tracking. Essential for compliance and user experience.

### 💡 Usage Example

```typescript
import {
  CreateEventCommand,
  UpdateEventCommand,
  DeleteEventCommand,
  RSVPCommand,
  CommandHistory
} from '../patterns/command.pattern';

// Create an event with audit trail
const createCommand = new CreateEventCommand(userId, {
  title: 'Summer Festival',
  description: 'Join us for music and fun',
  date: new Date('2025-07-15'),
  location: 'Central Park'
});

const event = await createCommand.execute();
// Automatically logged to audit trail

// Update an event
const updateCommand = new UpdateEventCommand(userId, eventId, {
  title: 'Summer Music Festival',
  location: 'Madison Square Garden'
});

await updateCommand.execute();
// Previous state stored for potential undo

// Undo last operation
await CommandHistory.getInstance().undoLast();

// Get user's command history
const userHistory = CommandHistory.getInstance().getUserHistory(userId, 10);
console.log('Recent actions:', userHistory.map(cmd => cmd.getDescription()));

// RSVP with tracking
const rsvpCommand = new RSVPCommand(userId, eventId, 'GOING');
await rsvpCommand.execute();
```

### ✅ Benefits
- **Audit Trail**: Every operation is logged with timestamp and user
- **Undo/Redo**: Revert operations if needed
- **Compliance**: Track all changes for regulatory requirements
- **Debugging**: See exactly what operations were performed
- **Testing**: Easy to test commands in isolation

### 🔧 Available Commands

**CreateEventCommand**:
- Creates a new event with audit logging
- Can be undone (deletes the event)

**UpdateEventCommand**:
- Updates an event, storing previous state
- Can be undone (restores previous state)

**DeleteEventCommand**:
- Deletes an event, storing all data
- Can be undone (recreates event and RSVPs)

**RSVPCommand**:
- Creates or updates RSVP
- Can be undone (restores previous RSVP or deletes)

**CommandHistory**:
- Singleton pattern for command tracking
- Methods: `add()`, `getHistory()`, `getUserHistory()`, `undoLast()`, `clear()`

---

## 4. Adapter Pattern

### 📁 Location
`src/adapters/email.adapter.ts`

### 🎯 Purpose
Provides a unified interface for different email providers. Switch between Ethereal (testing), SendGrid, AWS SES, or custom SMTP without changing business logic.

### 💡 Usage Example

```typescript
import {
  createEmailService,
  EmailService,
  EtherealAdapter,
  SendGridAdapter,
  AWSEmailAdapter,
  SMTPAdapter
} from '../adapters/email.adapter';
import { EmailFactory } from '../factories/email.factory';

// Automatic adapter selection based on environment
const emailService = createEmailService();
// Reads NODE_ENV and EMAIL_PROVIDER from environment

// Send email using current adapter
const mailOptions = EmailFactory.createWelcomeEmail('user@example.com');
const result = await emailService.send(mailOptions);

if (result.success) {
  console.log('Email sent!', result.messageId);
  console.log('Preview:', result.previewUrl);
}

// Manually create service with specific adapter
const testService = new EmailService(new EtherealAdapter());
await testService.send(mailOptions);

// Switch adapters at runtime
const prodService = new EmailService(new EtherealAdapter());
prodService.setAdapter(new SendGridAdapter(apiKey));
await prodService.send(mailOptions);

// Use custom SMTP
const customService = new EmailService(
  new SMTPAdapter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  })
);
```

### ✅ Benefits
- **Flexibility**: Switch email providers without code changes
- **Testing**: Use Ethereal in development, production provider in prod
- **Cost Management**: Switch providers based on pricing
- **Reliability**: Fallback to different provider if one fails
- **Environment-based**: Auto-configure based on environment variables

### 🔧 Available Adapters

**EtherealAdapter**:
- Testing/development only
- Generates preview URLs
- No actual email delivery

**SendGridAdapter**:
- Production-ready (placeholder - requires @sendgrid/mail)
- Requires SENDGRID_API_KEY environment variable

**AWSEmailAdapter**:
- Production-ready (placeholder - requires AWS SDK)
- Requires AWS credentials and region
- Cost-effective for high volume

**SMTPAdapter**:
- Works with any SMTP server
- Requires full SMTP configuration
- Good for custom email servers

### 🔧 Configuration

Set environment variables:

```env
EMAIL_PROVIDER=ethereal  # ethereal | sendgrid | aws | smtp
SENDGRID_API_KEY=your-key
AWS_REGION=us-east-1
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user
SMTP_PASS=password
```

---

## 🎯 Integration Guide

### Using All Patterns Together

Here's how these patterns work together in a real scenario:

```typescript
import { queryEvents } from '../builders/event-query.builder';
import { CreateEventCommand, CommandHistory } from '../patterns/command.pattern';
import { createEmailService } from '../adapters/email.adapter';
import { EmailFactory } from '../factories/email.factory';

// 1. Query events with Builder Pattern
const upcomingEvents = await queryEvents()
  .whereApproved()
  .whereUpcoming()
  .includeRSVPsWithUsers()
  .orderByDateAsc()
  .findMany();

// 2. Create event with Command Pattern (audit trail)
const createCommand = new CreateEventCommand(userId, eventData);
const newEvent = await createCommand.execute();

// 3. Send notification with Adapter + Factory Pattern
const emailService = createEmailService();
const attendees = event.rsvps.map(rsvp => rsvp.user.email);

for (const email of attendees) {
  const mailOptions = EmailFactory.createEventUpdatedEmail(
    email,
    event.title,
    event.date,
    'New event created!'
  );
  await emailService.send(mailOptions);
}

// 4. Review audit trail
const history = CommandHistory.getInstance().getUserHistory(userId);
console.log('User actions:', history.map(cmd => cmd.getDescription()));
```

---

## 📊 Benefits Summary

| Pattern | Primary Benefit | Use Case |
|---------|----------------|----------|
| Factory | Consistency & Maintainability | Email templates, object creation |
| Builder | Readability & Flexibility | Complex queries, configurations |
| Command | Audit Trail & Undo | User actions, compliance |
| Adapter | Interchangeability | Third-party services, testing |

---

## 🚀 Future Enhancements

Additional patterns that could be implemented:

1. **Template Method Pattern** - Standardize notification workflows
2. **State Pattern** - Event lifecycle management (Draft → Pending → Approved → Published)
3. **Specification Pattern** - Complex filtering logic
4. **Circuit Breaker Pattern** - Fault tolerance for external services
5. **Repository Pattern** - Further abstraction of data access

---

## 📝 Notes

- All patterns are fully TypeScript-typed
- Patterns integrate seamlessly with existing codebase
- Patterns follow SOLID principles
- Comprehensive error handling included
- Console logging for debugging and monitoring

---

## 🤝 Contributing

When adding new patterns:

1. Create pattern in appropriate directory (`/factories`, `/builders`, `/patterns`, `/adapters`)
2. Add comprehensive JSDoc comments
3. Include usage examples in this document
4. Write tests for the pattern
5. Update integration examples

---

*Last Updated: October 24, 2025*
