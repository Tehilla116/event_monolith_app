import { prisma } from "../db";
import type { Prisma } from "@prisma/client";

/**
 * Builder Pattern for Event Queries
 * Provides a fluent interface for constructing complex Prisma queries
 * Makes query building more readable and maintainable
 */
export class EventQueryBuilder {
  private whereConditions: Prisma.EventWhereInput = {};
  private includeOptions: Prisma.EventInclude = {};
  private orderByOptions: Prisma.EventOrderByWithRelationInput[] = [];
  private takeLimit?: number;
  private skipOffset?: number;

  /**
   * Filter for approved events only
   */
  whereApproved(): this {
    this.whereConditions.approved = true;
    return this;
  }

  /**
   * Filter for pending (unapproved) events
   */
  wherePending(): this {
    this.whereConditions.approved = false;
    return this;
  }

  /**
   * Filter for upcoming events (date >= now)
   */
  whereUpcoming(): this {
    this.whereConditions.date = {
      gte: new Date(),
    };
    return this;
  }

  /**
   * Filter for past events (date < now)
   */
  wherePast(): this {
    this.whereConditions.date = {
      lt: new Date(),
    };
    return this;
  }

  /**
   * Filter events by organizer ID
   */
  whereOrganizer(organizerId: string): this {
    this.whereConditions.organizerId = organizerId;
    return this;
  }

  /**
   * Filter events by date range
   */
  whereDateRange(startDate: Date, endDate: Date): this {
    this.whereConditions.date = {
      gte: startDate,
      lte: endDate,
    };
    return this;
  }

  /**
   * Search events by title or description
   */
  whereSearch(searchTerm: string): this {
    this.whereConditions.OR = [
      {
        title: {
          contains: searchTerm,
          mode: "insensitive" as Prisma.QueryMode,
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: "insensitive" as Prisma.QueryMode,
        },
      },
    ];
    return this;
  }

  /**
   * Filter events by location
   */
  whereLocation(location: string): this {
    this.whereConditions.location = {
      contains: location,
      mode: "insensitive" as Prisma.QueryMode,
    };
    return this;
  }

  /**
   * Include organizer information
   */
  includeOrganizer(): this {
    this.includeOptions.organizer = {
      select: {
        id: true,
        email: true,
        role: true,
      },
    };
    return this;
  }

  /**
   * Include RSVP information
   */
  includeRSVPs(): this {
    this.includeOptions.rsvps = {
      select: {
        id: true,
        status: true,
        userId: true,
      },
    };
    return this;
  }

  /**
   * Include RSVPs with full user details
   */
  includeRSVPsWithUsers(): this {
    this.includeOptions.rsvps = {
      select: {
        id: true,
        status: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    };
    return this;
  }

  /**
   * Include RSVP count grouped by status
   */
  includeRSVPCounts(): this {
    // This would require a separate aggregation query
    // For now, we'll include RSVPs and count client-side
    return this.includeRSVPs();
  }

  /**
   * Order by date ascending (oldest first)
   */
  orderByDateAsc(): this {
    this.orderByOptions.push({ date: "asc" });
    return this;
  }

  /**
   * Order by date descending (newest first)
   */
  orderByDateDesc(): this {
    this.orderByOptions.push({ date: "desc" });
    return this;
  }

  /**
   * Order by creation date descending (most recently created first)
   */
  orderByCreatedDesc(): this {
    this.orderByOptions.push({ createdAt: "desc" });
    return this;
  }

  /**
   * Order by title alphabetically
   */
  orderByTitle(): this {
    this.orderByOptions.push({ title: "asc" });
    return this;
  }

  /**
   * Limit the number of results
   */
  limit(count: number): this {
    this.takeLimit = count;
    return this;
  }

  /**
   * Skip a number of results (for pagination)
   */
  skip(count: number): this {
    this.skipOffset = count;
    return this;
  }

  /**
   * Pagination helper
   */
  paginate(page: number, pageSize: number = 10): this {
    this.takeLimit = pageSize;
    this.skipOffset = (page - 1) * pageSize;
    return this;
  }

  /**
   * Build and execute the query to find many events
   */
  async findMany() {
    const query: Prisma.EventFindManyArgs = {
      where: Object.keys(this.whereConditions).length > 0 ? this.whereConditions : undefined,
      include: Object.keys(this.includeOptions).length > 0 ? this.includeOptions : undefined,
      orderBy: this.orderByOptions.length > 0 ? this.orderByOptions : undefined,
      take: this.takeLimit,
      skip: this.skipOffset,
    };

    return await prisma.event.findMany(query);
  }

  /**
   * Build and execute the query to find first event matching criteria
   */
  async findFirst() {
    const query: Prisma.EventFindFirstArgs = {
      where: Object.keys(this.whereConditions).length > 0 ? this.whereConditions : undefined,
      include: Object.keys(this.includeOptions).length > 0 ? this.includeOptions : undefined,
      orderBy: this.orderByOptions.length > 0 ? this.orderByOptions : undefined,
    };

    return await prisma.event.findFirst(query);
  }

  /**
   * Count events matching the criteria
   */
  async count() {
    return await prisma.event.count({
      where: Object.keys(this.whereConditions).length > 0 ? this.whereConditions : undefined,
    });
  }

  /**
   * Check if any events exist matching the criteria
   */
  async exists() {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Get the raw query configuration (for debugging)
   */
  getQuery(): Prisma.EventFindManyArgs {
    return {
      where: this.whereConditions,
      include: this.includeOptions,
      orderBy: this.orderByOptions,
      take: this.takeLimit,
      skip: this.skipOffset,
    };
  }

  /**
   * Reset the builder to start fresh
   */
  reset(): this {
    this.whereConditions = {};
    this.includeOptions = {};
    this.orderByOptions = [];
    this.takeLimit = undefined;
    this.skipOffset = undefined;
    return this;
  }
}

/**
 * Helper function to create a new EventQueryBuilder instance
 * 
 * @example
 * ```typescript
 * const upcomingEvents = await queryEvents()
 *   .whereApproved()
 *   .whereUpcoming()
 *   .includeOrganizer()
 *   .includeRSVPs()
 *   .orderByDateAsc()
 *   .limit(10)
 *   .findMany();
 * ```
 */
export function queryEvents() {
  return new EventQueryBuilder();
}
