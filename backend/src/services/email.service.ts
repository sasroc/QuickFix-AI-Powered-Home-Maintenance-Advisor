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
        msg = {
          ...msg,
          text: options.text || '',
          html: options.html || options.text || '',
        };
      }

      console.log('Attempting to send email via SendGrid:', msg);
      await sgMail.send(msg);
      console.log('Email sent via SendGrid');
    } catch (error) {
      console.error('SendGrid Error:', error);
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
}

export default EmailService; 