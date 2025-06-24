# QuickFix Deployment Guide

## Deployment Architecture
- **Backend**: Railway (https://railway.app)
- **Frontend**: Netlify (https://netlify.com)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Email**: SendGrid

## Backend Deployment (Railway)

### 1. Create Railway Project
1. Go to https://railway.app and sign up/login
2. Create a new project
3. Connect your GitHub repository
4. Select the `backend` folder as the root directory

### 2. Environment Variables for Railway
Set these environment variables in your Railway dashboard:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=4000
FRONTEND_URL=https://your-netlify-domain.netlify.app

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="your_firebase_private_key_here"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_STARTER_MONTHLY_PRICE_ID=price_starter_monthly
STRIPE_STARTER_ANNUAL_PRICE_ID=price_starter_annual
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly
STRIPE_PRO_ANNUAL_PRICE_ID=price_pro_annual
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_premium_monthly
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_premium_annual

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_WELCOME_TEMPLATE_ID=your_welcome_template_id
SENDGRID_SUBSCRIPTION_CONFIRMATION_TEMPLATE_ID=your_subscription_template_id
SENDGRID_SUBSCRIPTION_CANCELLATION_TEMPLATE_ID=your_cancellation_template_id

# Sentry Configuration (optional)
SENTRY_DSN=your_sentry_dsn_here
```

### 3. Railway Configuration
Railway will automatically detect the Node.js project. The build and start commands are already configured in package.json.

### 4. Set up Stripe Webhooks
1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-railway-domain.railway.app/api/webhook`
3. Select events: 
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET` environment variable

## Frontend Deployment (Netlify)

### 1. Create Netlify Site
1. Go to https://netlify.com and sign up/login
2. Create new site from Git
3. Connect your GitHub repository
4. Set build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`

### 2. Environment Variables for Netlify
Set these in Netlify Site Settings > Environment Variables:

```bash
# Backend API URL (Railway URL)
REACT_APP_API_URL=https://your-railway-domain.railway.app

# Firebase Configuration (from Firebase Console)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Stripe Configuration (Publishable Key)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Sentry Configuration (optional)
REACT_APP_SENTRY_DSN=your_frontend_sentry_dsn
```

### 3. Netlify Configuration
The `netlify.toml` file is already configured with:
- SPA routing redirects
- Security headers
- Build settings

## Post-Deployment Steps

### 1. Update Frontend URL in Backend
After Netlify deployment, update the `FRONTEND_URL` environment variable in Railway with your Netlify domain.

### 2. Update Stripe Configuration
1. Update redirect URLs in Stripe Dashboard:
   - Success URL: `https://your-netlify-domain.netlify.app/payment-success`
   - Cancel URL: `https://your-netlify-domain.netlify.app/pricing`

### 3. Update Firebase Configuration
1. Add your Netlify domain to Firebase Console > Authentication > Settings > Authorized domains
2. Update Firestore security rules if needed
3. Update CORS settings for Firebase Storage if using file uploads

### 4. Test the Application
1. Test user registration and authentication
2. Test subscription flow with Stripe test cards
3. Test AI repair guide generation
4. Test email notifications
5. Test webhook functionality

## Monitoring and Maintenance

### Health Checks
- Backend health endpoint: `https://your-railway-domain.railway.app/health`
- Monitor Railway logs for errors
- Set up Sentry for error tracking

### Backup Strategy
- Firebase Firestore has automatic backups
- Export user data regularly if needed
- Monitor usage and costs

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **CORS**: Properly configured for production domains only
3. **Rate Limiting**: Already implemented in the backend
4. **Firebase Rules**: Ensure proper security rules are in place
5. **HTTPS**: Both Railway and Netlify provide HTTPS by default

## Cost Optimization

1. **Caching**: AI responses are cached to reduce OpenAI API costs
2. **Rate Limiting**: Prevents abuse of expensive AI endpoints
3. **Image Compression**: Images are compressed before storage
4. **Database Optimization**: Firestore queries are optimized

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check FRONTEND_URL environment variable
2. **Stripe Webhooks**: Ensure webhook secret is correct
3. **Firebase Errors**: Check Firebase service account credentials
4. **AI Errors**: Verify OpenAI API key and quota
5. **Email Errors**: Check SendGrid API key and templates

### Logs:
- Railway: Check deployment and runtime logs
- Netlify: Check build and function logs
- Sentry: Monitor application errors
- Firebase: Check Console for authentication/database errors 