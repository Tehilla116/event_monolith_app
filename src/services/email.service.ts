import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter with Ethereal test account
 */
async function initializeTransporter() {
  if (!transporter) {
    // Create a test account with Ethereal
    const testAccount = await nodemailer.createTestAccount();

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log("✉️  Ethereal email transporter initialized");
    console.log(`   User: ${testAccount.user}`);
  }

  return transporter;
}

/**
 * Send welcome email to new user
 * @param email - User's email address
 */
export async function sendWelcomeEmail(email: string) {
  try {
    const transport = await initializeTransporter();

    const info = await transport.sendMail({
      from: '"Event Management App" <noreply@eventapp.com>',
      to: email,
      subject: "Welcome to Event App! 🎉",
      text: `
Hello!

Welcome to Event Management App! We're excited to have you on board.

With our platform, you can:
- Discover and browse upcoming events
- RSVP to events that interest you
- Create and manage your own events
- Connect with other attendees

Get started by exploring events in your area or creating your first event!

Best regards,
The Event App Team
      `,
      html: `
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
  </style>
</head>
<body>
  <div class="container">
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
    
    <div class="footer">
      <p>You're receiving this email because you registered for Event Management App.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    console.log("📧 Welcome email sent successfully!");
    console.log(`   To: ${email}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Preview URL: ${previewUrl}`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    throw error;
  }
}

/**
 * Send event notification email
 * @param email - User's email address
 * @param eventTitle - Title of the event
 * @param eventDate - Date of the event
 */
export async function sendEventNotification(
  email: string,
  eventTitle: string,
  eventDate: Date
) {
  try {
    const transport = await initializeTransporter();

    const info = await transport.sendMail({
      from: '"Event Management App" <noreply@eventapp.com>',
      to: email,
      subject: `Event Reminder: ${eventTitle}`,
      text: `
Hello!

This is a reminder about the upcoming event:

Event: ${eventTitle}
Date: ${eventDate.toLocaleString()}

We look forward to seeing you there!

Best regards,
The Event App Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .event-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Event Reminder 📅</h1>
    </div>
    <div class="content">
      <p>Hello!</p>
      <p>This is a reminder about your upcoming event:</p>
      
      <div class="event-details">
        <h3>📍 ${eventTitle}</h3>
        <p><strong>Date:</strong> ${eventDate.toLocaleString()}</p>
      </div>

      <p>We look forward to seeing you there!</p>
      
      <p>Best regards,<br/>
      <strong>The Event App Team</strong></p>
    </div>
    
    <div class="footer">
      <p>You're receiving this email because you RSVP'd to this event.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    console.log("📧 Event notification sent successfully!");
    console.log(`   To: ${email}`);
    console.log(`   Preview URL: ${previewUrl}`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error) {
    console.error("❌ Failed to send event notification:", error);
    throw error;
  }
}
