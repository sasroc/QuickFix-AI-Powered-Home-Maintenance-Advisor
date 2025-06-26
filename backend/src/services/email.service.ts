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

  public async sendSubscriptionCancellation(
    to: string,
    name: string,
    plan: string,
    accessUntilDate: string,
    billingInterval: string
  ): Promise<void> {
    const planLabels = {
      starter: 'Starter',
      pro: 'Pro',
      premium: 'Premium'
    };

    const intervalLabels = {
      monthly: 'monthly',
      annual: 'annual'
    };

    // Try to use template if available, otherwise use HTML
    const templateId = process.env.SENDGRID_SUBSCRIPTION_CANCELLATION_TEMPLATE_ID;
    
    if (templateId) {
      // Template-based email
      await this.sendEmail({
        to,
        subject: 'Your QuickFixAI Subscription Has Been Cancelled',
        templateId,
        dynamicTemplateData: {
          name,
          plan: planLabels[plan as keyof typeof planLabels],
          billingInterval: intervalLabels[billingInterval as keyof typeof intervalLabels],
          accessUntilDate,
          supportEmail: this.supportEmail,
          frontendUrl: process.env.FRONTEND_URL,
        },
      });
    } else {
      // HTML-based email (fallback)
      await this.sendEmail({
        to,
        subject: 'Your QuickFixAI Subscription Has Been Cancelled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Subscription Cancelled</h1>
              <p style="color: #666; font-size: 16px;">Hi ${name},</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">We're sorry to see you go!</h2>
              <p style="color: #555; line-height: 1.6;">
                We've received your request to cancel your <strong>${planLabels[plan as keyof typeof planLabels]} ${intervalLabels[billingInterval as keyof typeof intervalLabels]}</strong> subscription.
              </p>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
              <h3 style="color: #155724; margin-top: 0;">✅ Your Access Continues</h3>
              <p style="color: #155724; font-weight: bold; margin-bottom: 10px;">
                You still have full access to QuickFixAI until: <strong>${accessUntilDate}</strong>
              </p>
              <p style="color: #155724; margin-bottom: 0;">
                Continue using all your current features, including AI repair guides, until your current billing period ends.
              </p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
              <h3 style="color: #856404; margin-top: 0;">📋 What Happens Next</h3>
              <ul style="color: #856404; line-height: 1.6;">
                <li>Your subscription will remain active until <strong>${accessUntilDate}</strong></li>
                <li>You can continue using all current features and credits</li>
                <li>No further charges will be made to your account</li>
                <li>After the end date, your account will be downgraded to the free tier</li>
              </ul>
            </div>

            <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
              <h3 style="color: #0c5460; margin-top: 0;">🔄 Change Your Mind?</h3>
              <p style="color: #0c5460; line-height: 1.6;">
                If you change your mind, you can reactivate your subscription anytime before <strong>${accessUntilDate}</strong> 
                by visiting your account settings. No setup fees or penalties!
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/pricing" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
                Reactivate Subscription
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #666; font-size: 14px;">
                Thank you for being part of the QuickFixAI community. We hope to see you again soon!
              </p>
              <p style="color: #666; font-size: 14px;">
                If you have any questions, please contact us at <a href="mailto:${this.supportEmail}" style="color: #007bff;">${this.supportEmail}</a>
              </p>
            </div>
          </div>
        `,
      });
    }
  }

  public async sendRefundConfirmation(
    to: string,
    name: string,
    refundAmount: number,
    plan: string
  ): Promise<void> {
    const planLabels = {
      starter: 'Starter',
      pro: 'Pro',
      premium: 'Premium'
    };

    await this.sendEmail({
      to,
      subject: 'Refund Processed - QuickFixAI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #28a745; margin-bottom: 10px;">✅ Refund Processed</h1>
            <p style="color: #666; font-size: 16px;">Hi ${name},</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin-top: 0;">Your refund has been processed successfully!</h2>
            <p style="color: #155724; line-height: 1.6;">
              We've processed a full refund of <strong>$${refundAmount.toFixed(2)}</strong> for your ${planLabels[plan as keyof typeof planLabels]} subscription.
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">📋 Refund Details</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li><strong>Refund Amount:</strong> $${refundAmount.toFixed(2)}</li>
              <li><strong>Plan:</strong> ${planLabels[plan as keyof typeof planLabels]}</li>
              <li><strong>Reason:</strong> No credits used within 24-hour refund period</li>
              <li><strong>Processing Time:</strong> 3-5 business days (may vary by payment method)</li>
            </ul>
          </div>

          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #155724; margin-top: 0;">✅ What Happens Next</h3>
            <p style="color: #155724; line-height: 1.6;">
              • Your subscription has been cancelled<br>
              • The refund will appear on your original payment method within 3-5 business days<br>
              • Your account has been downgraded to the free tier<br>
              • You can still access limited features with our free plan
            </p>
          </div>

          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
            <h3 style="color: #0c5460; margin-top: 0;">💡 Want to Try Again?</h3>
            <p style="color: #0c5460; line-height: 1.6;">
              If you'd like to give QuickFixAI another try in the future, you can always subscribe again. 
              We're constantly improving our service and would love to have you back!
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/pricing" 
               style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 0 10px;">
              View Our Plans
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #666; font-size: 14px;">
              Thank you for giving QuickFixAI a try. We appreciate your feedback and hope to serve you better in the future.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you have any questions about your refund, please contact us at <a href="mailto:${this.supportEmail}" style="color: #007bff;">${this.supportEmail}</a>
            </p>
          </div>
        </div>
      `,
    });
  }
}

export default EmailService; 