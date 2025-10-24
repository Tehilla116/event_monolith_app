/**
 * Design Patterns Usage Examples
 * Demonstrates how to use the implemented design patterns
 */

import { queryEvents } from "../builders/event-query.builder";
import { EmailFactory } from "../factories/email.factory";
import {
  CreateEventCommand,
  UpdateEventCommand,
  DeleteEventCommand,
  RSVPCommand,
  CommandHistory,
} from "../patterns/command.pattern";
import {
  createEmailService,
  EtherealAdapter,
} from "../adapters/email.adapter";

/**
 * Example 1: Builder Pattern - Query Events
 */
export async function exampleQueryEvents() {
  console.log("\n=== Example 1: Builder Pattern ===\n");

  // Simple query
  const upcomingEvents = await queryEvents()
    .whereApproved()
    .whereUpcoming()
    .includeOrganizer()
    .orderByDateAsc()
    .limit(10)
    .findMany();

  console.log(`Found ${upcomingEvents.length} upcoming events`);

  // Complex query with search
  const searchResults = await queryEvents()
    .whereApproved()
    .whereSearch("music")
    .whereUpcoming()
    .includeRSVPsWithUsers()
    .orderByDateAsc()
    .paginate(1, 5)
    .findMany();

  console.log(`Found ${searchResults.length} music events`);

  // Count events
  const totalEvents = await queryEvents().whereApproved().count();

  console.log(`Total approved events: ${totalEvents}`);
}

/**
 * Example 2: Factory Pattern - Create Emails
 */
export async function exampleEmailFactory() {
  console.log("\n=== Example 2: Factory Pattern ===\n");

  // Welcome email
  const welcomeEmail = EmailFactory.createWelcomeEmail("newuser@example.com");
  console.log("Welcome email created:", welcomeEmail.subject);

  // Event deleted email
  const deleteEmail = EmailFactory.createEventDeletedEmail(
    "user@example.com",
    "Summer Festival",
    new Date("2025-07-15")
  );
  console.log("Delete notification created:", deleteEmail.subject);

  // Event updated email
  const updateEmail = EmailFactory.createEventUpdatedEmail(
    "user@example.com",
    "Summer Festival",
    new Date("2025-07-15"),
    "Location changed to Central Park"
  );
  console.log("Update notification created:", updateEmail.subject);

  // Event reminder email
  const reminderEmail = EmailFactory.createEventReminderEmail(
    "user@example.com",
    "Summer Festival",
    new Date("2025-07-15"),
    "Central Park"
  );
  console.log("Reminder created:", reminderEmail.subject);
}

/**
 * Example 3: Command Pattern - Auditable Operations
 */
export async function exampleCommandPattern(userId: string) {
  console.log("\n=== Example 3: Command Pattern ===\n");

  // Create event with audit trail
  const createCommand = new CreateEventCommand(userId, {
    title: "Tech Conference 2025",
    description: "Annual technology conference",
    date: new Date("2025-08-20"),
    location: "Convention Center",
  });

  console.log("Executing: Create Event");
  const event = await createCommand.execute();
  console.log(`Event created: ${event.title}`);

  // Update event (stores previous state)
  const updateCommand = new UpdateEventCommand(userId, event.id, {
    title: "Tech Conference 2025 - Extended",
    location: "Grand Convention Center",
  });

  console.log("Executing: Update Event");
  await updateCommand.execute();
  console.log("Event updated");

  // RSVP to event
  const rsvpCommand = new RSVPCommand(userId, event.id, "GOING");

  console.log("Executing: RSVP");
  await rsvpCommand.execute();
  console.log("RSVP recorded");

  // View command history
  const history = CommandHistory.getInstance().getUserHistory(userId);
  console.log("\nCommand History:");
  history.forEach((cmd) => {
    console.log(`  - ${cmd.getTimestamp().toISOString()}: ${cmd.getDescription()}`);
  });

  // Undo last command
  console.log("\nUndoing last command...");
  await CommandHistory.getInstance().undoLast();
  console.log("Command undone");

  // Clean up - delete the event
  const deleteCommand = new DeleteEventCommand(userId, event.id);
  await deleteCommand.execute();
  console.log("Event deleted");
}

/**
 * Example 4: Adapter Pattern - Email Services
 */
export async function exampleEmailAdapter() {
  console.log("\n=== Example 4: Adapter Pattern ===\n");

  // Create email service (auto-selects adapter based on environment)
  const emailService = createEmailService();
  console.log(`Using provider: ${emailService.getProviderName()}`);

  // Send welcome email
  const welcomeEmail = EmailFactory.createWelcomeEmail("newuser@example.com");
  const result = await emailService.send(welcomeEmail);

  if (result.success) {
    console.log("Email sent successfully!");
    console.log(`  Message ID: ${result.messageId}`);
    if (result.previewUrl) {
      console.log(`  Preview URL: ${result.previewUrl}`);
    }
  } else {
    console.error("Email failed:", result.error);
  }

  // Switch to different adapter at runtime
  console.log("\nSwitching to Ethereal adapter...");
  emailService.setAdapter(new EtherealAdapter());

  const reminderEmail = EmailFactory.createEventReminderEmail(
    "user@example.com",
    "Tech Conference",
    new Date("2025-08-20"),
    "Convention Center"
  );

  const reminderResult = await emailService.send(reminderEmail);
  console.log("Reminder sent:", reminderResult.success);
}

/**
 * Example 5: All Patterns Together - Complete Workflow
 */
export async function exampleCompleteWorkflow(userId: string) {
  console.log("\n=== Example 5: Complete Workflow ===\n");

  // 1. Query upcoming events (Builder Pattern)
  console.log("Step 1: Query upcoming events");
  const upcomingEvents = await queryEvents()
    .whereApproved()
    .whereUpcoming()
    .includeRSVPsWithUsers()
    .orderByDateAsc()
    .limit(5)
    .findMany();

  console.log(`Found ${upcomingEvents.length} upcoming events`);

  // 2. Create a new event (Command Pattern)
  console.log("\nStep 2: Create new event");
  const createCommand = new CreateEventCommand(userId, {
    title: "Design Patterns Workshop",
    description: "Learn about design patterns in TypeScript",
    date: new Date("2025-09-15"),
    location: "Tech Hub",
  });

  const newEvent = await createCommand.execute();
  console.log(`Event created: ${newEvent.title}`);

  // 3. Initialize email service (Adapter Pattern)
  console.log("\nStep 3: Initialize email service");
  const emailService = createEmailService();
  console.log(`Email provider: ${emailService.getProviderName()}`);

  // 4. Send notifications (Factory Pattern + Adapter Pattern)
  console.log("\nStep 4: Send notifications");

  // Get all users who are interested (for this example, just the creator)
  const recipients = ["organizer@example.com"];

  for (const email of recipients) {
    const notification = EmailFactory.createEventReminderEmail(
      email,
      newEvent.title,
      newEvent.date,
      newEvent.location
    );

    const result = await emailService.send(notification);
    console.log(`Notification sent to ${email}:`, result.success);
  }

  // 5. View audit trail (Command Pattern)
  console.log("\nStep 5: View audit trail");
  const history = CommandHistory.getInstance().getUserHistory(userId, 5);

  console.log("Recent actions:");
  history.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.getDescription()}`);
    console.log(`     Time: ${cmd.getTimestamp().toISOString()}`);
  });

  // 6. Clean up
  console.log("\nStep 6: Clean up");
  const deleteCommand = new DeleteEventCommand(userId, newEvent.id);
  await deleteCommand.execute();
  console.log("Event deleted");

  console.log("\n=== Workflow Complete ===\n");
}

/**
 * Run all examples
 */
export async function runAllExamples(userId: string) {
  try {
    await exampleQueryEvents();
    await exampleEmailFactory();
    await exampleCommandPattern(userId);
    await exampleEmailAdapter();
    await exampleCompleteWorkflow(userId);

    console.log("\n✅ All examples completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error running examples:", error);
  }
}

// Uncomment to run examples:
// runAllExamples("user-123");
