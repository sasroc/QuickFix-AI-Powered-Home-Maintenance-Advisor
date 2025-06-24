# QuickFix-AI-Powered-Home-Maintenance-Advisor

An AI-powered home maintenance advisor that provides step-by-step repair guides using text, voice, and image input.

## 🚀 Ready for Production Deployment

This application is now configured for production deployment:
- **Backend**: Railway (Node.js/Express with TypeScript)
- **Frontend**: Netlify (React 19 with modern features)
- **Database**: Firebase Firestore
- **Payments**: Stripe with webhooks
- **AI**: OpenAI GPT-4o models with intelligent caching

## Features

- **AI-Powered Repair Analysis**: Uses OpenAI's GPT models to analyze repair issues and generate detailed guides
- **Multimodal Input**: Support for text descriptions, voice input, and image uploads
- **Interactive Repair Guides**: Step-by-step instructions with progress tracking and checklists
- **Subscription Management**: Credit-based system with Stripe integration
- **Automated Email Notifications**: Welcome, subscription confirmation, and cancellation emails
- **Community Features**: Share repair success stories and tips
- **Feedback System**: Comprehensive feedback collection with admin dashboard

## Deployment

### Quick Start
1. **Backend (Railway)**: See `DEPLOYMENT_SETUP.md` for detailed instructions
2. **Frontend (Netlify)**: Configured with `netlify.toml` for automatic deployment

### Key Changes Made for Production
- ✅ Environment-based configuration for Railway and Netlify
- ✅ CORS properly configured for production domains
- ✅ Centralized API configuration with fallbacks
- ✅ Production-ready logging and error handling
- ✅ Optimized build scripts and dependencies
- ✅ Security headers and rate limiting
- ✅ Stripe webhook endpoint configuration
- ✅ Firebase environment variable support

## Recent Updates

### Production Deployment Ready
- Updated all API endpoints to use centralized configuration
- Enhanced CORS settings for production environments
- Added comprehensive deployment documentation
- Optimized logging for Railway and Netlify platforms
- Updated build processes for reliable deployments

### Subscription Cancellation Emails
- Automated cancellation confirmation emails sent when users cancel subscriptions
- Includes access period details and reactivation options
- Professional email design with clear next steps
- Support for both SendGrid templates and HTML fallback

## Documentation

- [Deployment Guide](DEPLOYMENT_SETUP.md) - Complete deployment instructions
- [Context & Architecture](docs/CONTEXT.md)
- [Feedback System](docs/FEEDBACK_SYSTEM.md)
- [Firebase Security Setup](docs/FIREBASE_SECURITY_SETUP.md)

## Tech Stack

- **Frontend**: React 19, Chakra UI, Framer Motion
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI GPT-4o, GPT-4o-mini
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Email**: SendGrid
- **Deployment**: Railway (Backend) + Netlify (Frontend)

## Environment Variables

### Backend (Railway)
See `DEPLOYMENT_SETUP.md` for complete list of required environment variables.

### Frontend (Netlify)
```bash
REACT_APP_API_URL=https://your-railway-domain.railway.app
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## Testing Production Configuration

1. **Health Check**: `https://your-railway-domain.railway.app/health`
2. **API Endpoints**: All endpoints properly configured with CORS
3. **Stripe Webhooks**: Ready for live webhook testing
4. **Firebase Auth**: Configured for production domains

## Support

For deployment issues or questions, refer to the `DEPLOYMENT_SETUP.md` guide or check the troubleshooting section.