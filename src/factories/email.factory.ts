import type { SendMailOptions } from "nodemailer";

/**
 * Email Factory Pattern
 * Creates standardized email configurations for different email types
 * Centralizes email template generation and ensures consistency
 */

const FROM_EMAIL = '"Event Management App" <noreply@eventapp.com>';

/**
 * Base email template with common styling
 */
const getEmailTemplate = (content: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .feature { margin: 15px 0; padding-left: 25px; }
    .feature:before { content: "✓"; color: #667eea; font-weight: bold; margin-right: 10px; }
    .cta { text-align: center; margin: 30px 0; }
    .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .info { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
    .danger { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>This is an automated email from Event Management App.</p>
      <p>© ${new Date().getFullYear()} Event App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email Factory Class
 * Factory pattern for creating different types of emails
 */
export class EmailFactory {
  /**
   * Create welcome email for new users
   */
  static createWelcomeEmail(email: string): SendMailOptions {
    const content = `
      <div class="header">
        <h1>Welcome to Event App! 🎉</h1>
      </div>
      <div class="content">
        <p>Hello!</p>
        <p>We're excited to have you on board. Welcome to Event Management App, your go-to platform for discovering and managing events.</p>
        
        <div class="features">
          <h3>What you can do:</h3>
          <div class="feature">Discover and browse upcoming events</div>
          <div class="feature">RSVP to events that interest you</div>
          <div class="feature">Create and manage your own events</div>
          <div class="feature">Connect with other attendees</div>
        </div>

        <div class="cta">
          <a href="#" class="button">Explore Events</a>
        </div>

        <p>Get started by exploring events in your area or creating your first event!</p>
        
        <p>Best regards,<br/>
        <strong>The Event App Team</strong></p>
      </div>
    `;

    return {
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Event App! 🎉",
      html: getEmailTemplate(content),
      text: this.stripHtml(content),
    };
  }

  /**
   * Create event deleted notification email
   */
  static createEventDeletedEmail(
    email: string,
    eventTitle: string,
    eventDate: Date
  ): SendMailOptions {
    const content = `
      <div class="header">
        <h1>Event Cancelled ⚠️</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        
        <div class="danger">
          <p><strong>Important Notice:</strong> An event you RSVPed to has been cancelled.</p>
        </div>

        <div class="features">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Scheduled Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
        </div>

        <p>We apologize for any inconvenience this may cause. The event organizer or administrator has cancelled this event.</p>

        <div class="cta">
          <a href="#" class="button">Browse Other Events</a>
        </div>

        <p>Best regards,<br/>
        <strong>The Event App Team</strong></p>
      </div>
    `;

    return {
      from: FROM_EMAIL,
      to: email,
      subject: `Event Cancelled: ${eventTitle}`,
      html: getEmailTemplate(content),
      text: this.stripHtml(content),
    };
  }

  /**
   * Create event updated notification email
   */
  static createEventUpdatedEmail(
    email: string,
    eventTitle: string,
    eventDate: Date,
    changes: string
  ): SendMailOptions {
    const content = `
      <div class="header">
        <h1>Event Updated 📝</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        
        <div class="alert">
          <p><strong>Update Notice:</strong> An event you RSVPed to has been updated.</p>
        </div>

        <div class="features">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}</p>
          <p><strong>Changes:</strong> ${changes}</p>
        </div>

        <p>Please review the changes and update your plans accordingly.</p>

        <div class="cta">
          <a href="#" class="button">View Event Details</a>
        </div>

        <p>Best regards,<br/>
        <strong>The Event App Team</strong></p>
      </div>
    `;

    return {
      from: FROM_EMAIL,
      to: email,
      subject: `Event Updated: ${eventTitle}`,
      html: getEmailTemplate(content),
      text: this.stripHtml(content),
    };
  }

  /**
   * Create event reminder email
   */
  static createEventReminderEmail(
    email: string,
    eventTitle: string,
    eventDate: Date,
    location: string
  ): SendMailOptions {
    const content = `
      <div class="header">
        <h1>Event Reminder ⏰</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        
        <div class="info">
          <p><strong>Reminder:</strong> You have an upcoming event!</p>
        </div>

        <div class="features">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date & Time:</strong> ${new Date(eventDate).toLocaleString()}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>

        <p>Don't forget to attend! We look forward to seeing you there.</p>

        <div class="cta">
          <a href="#" class="button">View Event Details</a>
        </div>

        <p>Best regards,<br/>
        <strong>The Event App Team</strong></p>
      </div>
    `;

    return {
      from: FROM_EMAIL,
      to: email,
      subject: `Reminder: ${eventTitle} - ${new Date(eventDate).toLocaleDateString()}`,
      html: getEmailTemplate(content),
      text: this.stripHtml(content),
    };
  }

  /**
   * Create RSVP confirmation email
   */
  static createRsvpConfirmationEmail(
    email: string,
    eventTitle: string,
    eventDate: Date,
    location: string,
    status: string
  ): SendMailOptions {
    const statusEmoji = status === 'GOING' ? '✅' : status === 'MAYBE' ? '❓' : '❌';
    const statusText = status === 'GOING' ? 'confirmed' : status === 'MAYBE' ? 'tentative' : 'declined';

    const content = `
      <div class="header">
        <h1>RSVP ${statusText.toUpperCase()} ${statusEmoji}</h1>
      </div>
      <div class="content">
        <p>Hello,</p>
        
        <div class="info">
          <p><strong>Confirmation:</strong> Your RSVP has been ${statusText}!</p>
        </div>

        <div class="features">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date & Time:</strong> ${new Date(eventDate).toLocaleString()}</p>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Your Status:</strong> ${status}</p>
        </div>

        ${status === 'GOING' ? '<p>We look forward to seeing you at the event!</p>' : ''}
        ${status === 'MAYBE' ? '<p>Let us know when you make a final decision!</p>' : ''}

        <div class="cta">
          <a href="#" class="button">View Event Details</a>
        </div>

        <p>Best regards,<br/>
        <strong>The Event App Team</strong></p>
      </div>
    `;

    return {
      from: FROM_EMAIL,
      to: email,
      subject: `RSVP ${statusText}: ${eventTitle}`,
      html: getEmailTemplate(content),
      text: this.stripHtml(content),
    };
  }

  /**
   * Helper: Strip HTML tags for plain text version
   */
  private static stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
