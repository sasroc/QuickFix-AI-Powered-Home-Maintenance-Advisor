# Netlify Environment Variables

Copy these environment variables to your Netlify project settings:

## Required Variables

```bash
# Backend API URL (Railway deployment)
REACT_APP_API_URL=https://your-railway-domain.railway.app

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## Optional Variables

```bash
# Sentry Configuration (for error tracking)
REACT_APP_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
REACT_APP_SENTRY_RELEASE=quickfix-frontend@1.0.0
REACT_APP_VERSION=1.0.0
```

## How to Set in Netlify

1. Go to your Netlify dashboard
2. Select your project
3. Go to Site settings > Environment variables
4. Add each variable above with the correct values
5. Deploy your site

## Notes

- Use your actual Railway domain for `REACT_APP_API_URL`
- Use your Firebase project configuration values
- Use Stripe's publishable key (starts with `pk_`)
- Sentry variables are optional but recommended for production error tracking 