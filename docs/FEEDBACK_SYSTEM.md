# QuickFix Feedback System

## Overview

The QuickFix feedback system provides a comprehensive way for users to submit bug reports, feature requests, and general feedback. The system includes a floating feedback widget, detailed forms, screenshot uploads, email notifications, and an admin dashboard for managing feedback.

## Features

### User-Facing Features

1. **Floating Feedback Widget**
   - Always accessible floating button on all pages
   - Three feedback types: Bug Report, Feature Request, General Feedback
   - Smooth animations and modern UI

2. **Detailed Feedback Forms**
   - Type-specific forms with relevant fields
   - Bug reports include: steps to reproduce, expected vs actual behavior
   - Feature requests and general feedback with priority and category selection
   - Screenshot upload support (up to 5 images, 5MB each)

3. **User Experience**
   - Pre-filled email for logged-in users
   - Form validation and error handling
   - Success confirmation with auto-close
   - Responsive design for mobile devices

### Admin Features

1. **Feedback Dashboard** (`/admin/feedback`)
   - View all submitted feedback
   - Filter by status, type, and priority
   - Update feedback status (new → in progress → resolved)
   - View detailed feedback with screenshots
   - Send resolution emails to users

2. **Email Notifications**
   - Automatic notifications to support team for new feedback
   - Confirmation emails to users
   - Resolution emails when feedback is marked as resolved

## Technical Implementation

### Frontend Components

- `FeedbackWidget.js` - Floating feedback button and type selection
- `FeedbackModal.js` - Detailed feedback form with type-specific fields
- `FeedbackDashboard.js` - Admin dashboard for managing feedback
- CSS files for styling with dark mode support

### Backend API

- `POST /api/feedback/submit` - Submit new feedback with file uploads
- `GET /api/feedback` - Retrieve feedback with filtering
- `PATCH /api/feedback/:id/status` - Update feedback status

### Database Schema

Feedback is stored in Firestore with the following structure:

```javascript
{
  id: "auto-generated",
  type: "bug|feature|general",
  title: "string",
  description: "string",
  email: "string",
  priority: "low|medium|high|critical",
  category: "string",
  userId: "string|anonymous",
  userAgent: "string",
  url: "string",
  timestamp: "ISO string",
  status: "new|in_progress|resolved|closed",
  screenshots: ["base64 strings"],
  steps: "string", // bug reports only
  expected: "string", // bug reports only
  actual: "string", // bug reports only
  response: "string", // admin response
  createdAt: "timestamp",
  updatedAt: "timestamp",
  respondedAt: "timestamp" // when admin responded
}
```

### Email Templates

The system sends three types of emails:

1. **Support Notification** - Sent to support team for new feedback
2. **User Confirmation** - Sent to user confirming feedback submission
3. **Resolution Email** - Sent to user when feedback is resolved

## Usage

### For Users

1. Click the floating "Feedback" button on any page
2. Select feedback type (Bug, Feature, General)
3. Fill out the form with relevant details
4. Optionally upload screenshots
5. Submit and receive confirmation email

### For Administrators

1. Navigate to `/admin/feedback`
2. Use filters to find specific feedback
3. Click "View Details" to see full feedback
4. Update status and optionally add response
5. System automatically sends resolution emails

## Configuration

### Environment Variables

```bash
# Email configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@quickfix.ai
SENDGRID_SUPPORT_EMAIL=support@quickfix.ai

# Optional: Email template IDs for SendGrid templates
SENDGRID_FEEDBACK_NOTIFICATION_TEMPLATE_ID=template_id
SENDGRID_FEEDBACK_CONFIRMATION_TEMPLATE_ID=template_id
SENDGRID_FEEDBACK_RESOLUTION_TEMPLATE_ID=template_id
```

### File Upload Limits

- Maximum 5 screenshots per feedback
- Maximum 5MB per image
- Supported formats: JPG, PNG, GIF, WebP

## Security Considerations

1. **File Upload Security**
   - File type validation (images only)
   - File size limits
   - Base64 encoding for storage

2. **Access Control**
   - Feedback dashboard requires authentication
   - User data is associated with feedback for tracking

3. **Data Privacy**
   - User agent and URL are captured for debugging
   - Email addresses are required for communication
   - Screenshots are stored as base64 in Firestore

## Future Enhancements

1. **Advanced Filtering**
   - Date range filters
   - User-specific feedback views
   - Search functionality

2. **Integration Features**
   - GitHub issue creation for bugs
   - Slack notifications
   - Analytics dashboard

3. **User Features**
   - Feedback history for logged-in users
   - Status tracking
   - Follow-up comments

4. **Admin Features**
   - Bulk status updates
   - Feedback analytics
   - Export functionality

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (max 5MB)
   - Ensure file is an image format
   - Verify network connection

2. **Email Not Sending**
   - Check SendGrid API key
   - Verify email addresses are valid
   - Check SendGrid account limits

3. **Dashboard Not Loading**
   - Ensure user is authenticated
   - Check Firestore permissions
   - Verify API endpoints are accessible

### Debug Information

The system logs important events:
- Feedback submissions
- Status updates
- Email sending attempts
- File upload processing

Check the backend logs for detailed error information. 