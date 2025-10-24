import { prisma } from "../db";
import type { Event } from "@prisma/client";

/**
 * Command Pattern Implementation
 * Encapsulates operations as objects, enabling undo/redo, audit logging, and operation queuing
 */

/**
 * Base Command Interface
 * All commands must implement execute() and undo() methods
 */
export interface Command<T = any> {
  execute(): Promise<T>;
  undo(): Promise<void>;
  getDescription(): string;
  getTimestamp(): Date;
  getUserId(): string;
}

/**
 * Command History Manager
 * Tracks executed commands for audit trail and potential undo operations
 */
export class CommandHistory {
  private static instance: CommandHistory;
  private history: Command[] = [];
  private maxHistorySize = 100;

  private constructor() {}

  static getInstance(): CommandHistory {
    if (!CommandHistory.instance) {
      CommandHistory.instance = new CommandHistory();
    }
    return CommandHistory.instance;
  }

  /**
   * Add a command to history
   */
  add(command: Command): void {
    this.history.push(command);
    
    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Log to audit trail
    console.log(`[AUDIT] ${command.getTimestamp().toISOString()} - ${command.getDescription()} by user ${command.getUserId()}`);
  }

  /**
   * Get command history
   */
  getHistory(): Command[] {
    return [...this.history];
  }

  /**
   * Get recent commands for a specific user
   */
  getUserHistory(userId: string, limit: number = 10): Command[] {
    return this.history
      .filter(cmd => cmd.getUserId() === userId)
      .slice(-limit);
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Undo last command
   */
  async undoLast(): Promise<void> {
    const lastCommand = this.history.pop();
    if (lastCommand) {
      await lastCommand.undo();
      console.log(`[AUDIT] Undid: ${lastCommand.getDescription()}`);
    }
  }
}

/**
 * Create Event Command
 */
export class CreateEventCommand implements Command<Event> {
  private createdEvent?: Event;
  private timestamp: Date;

  constructor(
    private userId: string,
    private eventData: {
      title: string;
      description: string;
      date: Date;
      location: string;
    }
  ) {
    this.timestamp = new Date();
  }

  async execute(): Promise<Event> {
    this.createdEvent = await prisma.event.create({
      data: {
        ...this.eventData,
        organizerId: this.userId,
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

    // Add to audit trail
    CommandHistory.getInstance().add(this);

    return this.createdEvent;
  }

  async undo(): Promise<void> {
    if (this.createdEvent) {
      // Delete RSVPs first
      await prisma.rSVP.deleteMany({
        where: { eventId: this.createdEvent.id },
      });
      
      // Delete the event
      await prisma.event.delete({
        where: { id: this.createdEvent.id },
      });
      
      console.log(`Undid event creation: ${this.createdEvent.title}`);
    }
  }

  getDescription(): string {
    return `Created event: ${this.eventData.title}`;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getUserId(): string {
    return this.userId;
  }
}

/**
 * Update Event Command
 */
export class UpdateEventCommand implements Command<Event> {
  private previousEventState?: Event;
  private updatedEvent?: Event;
  private timestamp: Date;

  constructor(
    private userId: string,
    private eventId: string,
    private eventData: {
      title?: string;
      description?: string;
      date?: Date;
      location?: string;
    }
  ) {
    this.timestamp = new Date();
  }

  async execute(): Promise<Event> {
    // Store previous state for undo
    this.previousEventState = await prisma.event.findUnique({
      where: { id: this.eventId },
    }) || undefined;

    this.updatedEvent = await prisma.event.update({
      where: { id: this.eventId },
      data: this.eventData,
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

    // Add to audit trail
    CommandHistory.getInstance().add(this);

    return this.updatedEvent;
  }

  async undo(): Promise<void> {
    if (this.previousEventState) {
      await prisma.event.update({
        where: { id: this.eventId },
        data: {
          title: this.previousEventState.title,
          description: this.previousEventState.description,
          date: this.previousEventState.date,
          location: this.previousEventState.location,
        },
      });
      
      console.log(`Undid event update: ${this.updatedEvent?.title}`);
    }
  }

  getDescription(): string {
    return `Updated event: ${this.eventId}`;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getUserId(): string {
    return this.userId;
  }
}

/**
 * Delete Event Command
 */
export class DeleteEventCommand implements Command<void> {
  private deletedEvent?: Event;
  private deletedRSVPs?: any[];
  private timestamp: Date;

  constructor(
    private userId: string,
    private eventId: string
  ) {
    this.timestamp = new Date();
  }

  async execute(): Promise<void> {
    // Store event data for potential undo
    const eventWithRsvps = await prisma.event.findUnique({
      where: { id: this.eventId },
      include: {
        rsvps: true,
      },
    });

    if (eventWithRsvps) {
      this.deletedEvent = eventWithRsvps;
      this.deletedRSVPs = eventWithRsvps.rsvps;
    }

    // Delete RSVPs first
    await prisma.rSVP.deleteMany({
      where: { eventId: this.eventId },
    });

    // Delete the event
    await prisma.event.delete({
      where: { id: this.eventId },
    });

    // Add to audit trail
    CommandHistory.getInstance().add(this);
  }

  async undo(): Promise<void> {
    if (this.deletedEvent) {
      // Recreate the event
      await prisma.event.create({
        data: {
          id: this.deletedEvent.id,
          title: this.deletedEvent.title,
          description: this.deletedEvent.description,
          date: this.deletedEvent.date,
          location: this.deletedEvent.location,
          organizerId: this.deletedEvent.organizerId,
          approved: this.deletedEvent.approved,
        },
      });

      // Recreate RSVPs
      if (this.deletedRSVPs && this.deletedRSVPs.length > 0) {
        await prisma.rSVP.createMany({
          data: this.deletedRSVPs.map(rsvp => ({
            userId: rsvp.userId,
            eventId: rsvp.eventId,
            status: rsvp.status,
          })),
        });
      }

      console.log(`Undid event deletion: ${this.deletedEvent.title}`);
    }
  }

  getDescription(): string {
    return `Deleted event: ${this.deletedEvent?.title || this.eventId}`;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getUserId(): string {
    return this.userId;
  }
}

/**
 * RSVP Command
 */
export class RSVPCommand implements Command<any> {
  private previousRsvp?: any;
  private newRsvp?: any;
  private timestamp: Date;

  constructor(
    private userId: string,
    private eventId: string,
    private status: "GOING" | "MAYBE" | "NOT_GOING"
  ) {
    this.timestamp = new Date();
  }

  async execute(): Promise<any> {
    // Check if RSVP already exists
    this.previousRsvp = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId: this.userId,
          eventId: this.eventId,
        },
      },
    });

    // Upsert RSVP
    this.newRsvp = await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: this.userId,
          eventId: this.eventId,
        },
      },
      update: {
        status: this.status,
      },
      create: {
        userId: this.userId,
        eventId: this.eventId,
        status: this.status,
      },
    });

    // Add to audit trail
    CommandHistory.getInstance().add(this);

    return this.newRsvp;
  }

  async undo(): Promise<void> {
    if (this.previousRsvp) {
      // Restore previous RSVP
      await prisma.rSVP.update({
        where: {
          userId_eventId: {
            userId: this.userId,
            eventId: this.eventId,
          },
        },
        data: {
          status: this.previousRsvp.status,
        },
      });
    } else {
      // Delete the RSVP if it didn't exist before
      await prisma.rSVP.delete({
        where: {
          userId_eventId: {
            userId: this.userId,
            eventId: this.eventId,
          },
        },
      });
    }

    console.log(`Undid RSVP for event: ${this.eventId}`);
  }

  getDescription(): string {
    return `RSVP'd ${this.status} to event: ${this.eventId}`;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getUserId(): string {
    return this.userId;
  }
}
