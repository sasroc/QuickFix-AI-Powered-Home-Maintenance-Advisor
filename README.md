# QuickFix-AI-Powered-Home-Maintenance-Advisor

An AI-powered home maintenance advisor that provides step-by-step repair guides using text, voice, and image input.

## Features

- **AI-Powered Repair Analysis**: Uses OpenAI's GPT models to analyze repair issues and generate detailed guides
- **Multimodal Input**: Support for text descriptions, voice input, and image uploads
- **Interactive Repair Guides**: Step-by-step instructions with progress tracking and checklists
- **Subscription Management**: Credit-based system with Stripe integration
- **Automated Email Notifications**: Welcome, subscription confirmation, and cancellation emails
- **Community Features**: Share repair success stories and tips
- **Feedback System**: Comprehensive feedback collection with admin dashboard

## Recent Updates

### Subscription Cancellation Emails
- Automated cancellation confirmation emails sent when users cancel subscriptions
- Includes access period details and reactivation options
- Professional email design with clear next steps
- Support for both SendGrid templates and HTML fallback

## Documentation

- [Context & Architecture](docs/CONTEXT.md)
- [Feedback System](docs/FEEDBACK_SYSTEM.md)
- [Subscription Cancellation Emails](docs/SUBSCRIPTION_CANCELLATION_EMAIL.md)

## Tech Stack

- **Frontend**: React 19, Chakra UI, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI GPT-4o, GPT-4o-mini
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Email**: SendGrid
- **Deployment**: Hugging Face Spaces, Vercel/Netlify