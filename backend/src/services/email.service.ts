import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

class EmailService {
  private static instance: EmailService;
  private readonly fromEmail: string;
  private readonly supportEmail: string;

  private constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@quickfix.ai';
    this.supportEmail = process.env.SENDGRID_SUPPORT_EMAIL || 'support@quickfix.ai';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let msg: any = {
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
      };

      if (options.templateId) {
        // Template-based email
        msg = {
          ...msg,
          templateId: options.templateId,
          dynamicTemplateData: options.dynamicTemplateData,
        };
      } else {
        // Content-based email
        if (!options.html && !options.text) {
          throw new Error('Email must have either text or html content.');
        }
        if (options.html) {
          msg.html = options.html;
        }
        if (options.text) {
          msg.text = options.text;
        } else {
          // SendGrid recommends having a text part. For now, we'll create a simple one if not provided.
          msg.text = 'Please view this email in an HTML-compatible client.';
        }
      }

      await sgMail.send(msg);
    } catch (error: any) {
      if (error.response) {
        console.error('SendGrid API Error Response:', error.response.body);
      } else {
        console.error('SendGrid Error:', error);
      }
      throw new Error('Failed to send email');
    }
  }

  public async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Welcome to QuickFixAI!',
      templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
      dynamicTemplateData: {
        name,
        supportEmail: this.supportEmail,
      },
    });
  }

  public async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reset Your QuickFixAI Password',
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
      dynamicTemplateData: {
        resetLink,
        supportEmail: this.supportEmail,
      },
    });
  }

  public async sendSubscriptionConfirmation(to: string, name: string, plan: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Your QuickFixAI Subscription is Active!',
      templateId: process.env.SENDGRID_SUBSCRIPTION_TEMPLATE_ID,
      dynamicTemplateData: {
        name,
        plan,
        supportEmail: this.supportEmail,
      },
    });
  }

  public async sendSupportEmail(from: string, subject: string, message: string): Promise<void> {
    await this.sendEmail({
      to: this.supportEmail,
      subject: `Support Request: ${subject}`,
      text: `From: ${from}\n\nMessage: ${message}`,
    });
  }

  // Feedback-related email methods
  public async sendFeedbackNotification(
    fromEmail: string,
    type: string,
    title: string,
    description: string,
    priority: string,
    screenshotCount: number
  ): Promise<void> {
    const typeLabels = {
      bug: 'Bug Report',
      feature: 'Feature Request',
      general: 'General Feedback'
    };

    const priorityLabels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    };

    await this.sendEmail({
      to: this.supportEmail,
      subject: `[${typeLabels[type as keyof typeof typeLabels]}] ${title}`,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Type:</strong> ${typeLabels[type as keyof typeof typeLabels]}</p>
        <p><strong>Priority:</strong> ${priorityLabels[priority as keyof typeof priorityLabels]}</p>
        <p><strong>From:</strong> ${fromEmail}</p>
        <p><strong>Title:</strong> ${title}</p>
        <p><strong>Description:</strong></p>
        <p>${description.replace(/\n/g, '<br>')}</p>
        <p><strong>Screenshots:</strong> ${screenshotCount} attached</p>
        <hr>
        <p><em>This is an automated notification from QuickFixAI feedback system.</em></p>
      `,
    });
  }

  public async sendFeedbackConfirmation(
    to: string,
    type: string,
    title: string
  ): Promise<void> {
    const typeLabels = {
      bug: 'bug report',
      feature: 'feature request',
      general: 'feedback'
    };

    await this.sendEmail({
      to,
      subject: 'Thank you for your feedback - QuickFixAI',
      html: `
        <h2>Thank you for your ${typeLabels[type as keyof typeof typeLabels]}!</h2>
        <p>We've received your feedback about: <strong>${title}</strong></p>
        <p>Our team will review it and get back to you as soon as possible.</p>
        <p>If you have any urgent questions, please don't hesitate to contact us at ${this.supportEmail}.</p>
        <hr>
        <p><em>Thank you for helping us improve QuickFixAI!</em></p>
      `,
    });
  }

  public async sendFeedbackResolution(
    to: string,
    title: string,
    response: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Your feedback has been resolved - QuickFixAI',
      html: `
        <h2>Your feedback has been resolved!</h2>
        <p>Regarding: <strong>${title}</strong></p>
        <p>Our team has reviewed and resolved your feedback. Here's our response:</p>
        <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          ${response.replace(/\n/g, '<br>')}
        </div>
        <p>Thank you for helping us improve QuickFixAI!</p>
        <p>If you have any follow-up questions, please contact us at ${this.supportEmail}.</p>
      `,
    });
  }
}

export default EmailService; 