# QuickFix Deployment Checklist

## ✅ Backend Deployment (Railway) - Start Here

### Step 1: Prepare Railway Deployment
- [ ] Go to [Railway.app](https://railway.app) and create an account
- [ ] Create a new project
- [ ] Connect your GitHub repository
- [ ] Set Railway to deploy from the `backend` folder

### Step 2: Set Environment Variables in Railway
Copy these environment variables to your Railway project settings:

```bash
# IMPORTANT: Set this first to ensure production mode
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-netlify-domain.netlify.app  # Optional - you can add this later

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="your_firebase_private_key_here"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
STRIPE_STARTER_MONTHLY_PRICE_ID=price_starter_monthly
STRIPE_STARTER_ANNUAL_PRICE_ID=price_starter_annual
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly
STRIPE_PRO_ANNUAL_PRICE_ID=price_pro_annual
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_premium_monthly
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_premium_annual

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_WELCOME_TEMPLATE_ID=your_welcome_template_id
SENDGRID_SUBSCRIPTION_CONFIRMATION_TEMPLATE_ID=your_subscription_template_id
SENDGRID_SUBSCRIPTION_CANCELLATION_TEMPLATE_ID=your_cancellation_template_id

# Sentry (Optional)
SENTRY_DSN=your_sentry_dsn_here
```

**Note**: You can leave `FRONTEND_URL` empty initially or set it later. The backend is configured to allow localhost connections for testing.

### Step 3: Deploy Backend
- [ ] Push your changes to GitHub
- [ ] Railway will automatically deploy
- [ ] Check Railway logs for successful deployment
- [ ] Test health endpoint: `https://your-railway-domain.railway.app/health`

### Step 3.5: Test with Local Frontend (RECOMMENDED)
Before deploying your frontend, test with your local development setup:

- [ ] Update your local frontend environment:
  ```bash
  # In frontend/.env.local (create this file)
  REACT_APP_API_URL=https://your-railway-domain.railway.app
  ```
- [ ] Run your frontend locally: `cd frontend && npm start`
- [ ] Test the complete flow:
  - [ ] User registration/login
  - [ ] AI repair requests
  - [ ] Subscription flow (use Stripe test cards)
  - [ ] Check Railway logs for API calls
- [ ] Fix any issues before deploying frontend to Netlify

### Step 4: Set Up Stripe Webhooks (CRITICAL for Live Payments)
- [ ] Go to Stripe Dashboard > Developers > Webhooks
- [ ] Add endpoint: `https://your-railway-domain.railway.app/api/webhook`
- [ ] Select these events:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
- [ ] Copy the webhook signing secret
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Railway environment variables
- [ ] Test webhook with Stripe CLI or test payments

## ✅ Frontend Deployment (Netlify) - After Backend is Live

### Step 1: Prepare Netlify Deployment
- [ ] Go to [Netlify.com](https://netlify.com) and create an account
- [ ] Create new site from Git
- [ ] Connect your GitHub repository
- [ ] Set build settings:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `frontend/build`

### Step 2: Set Environment Variables in Netlify
Go to Site Settings > Environment Variables and add:

```bash
# Backend API (Your Railway URL)
REACT_APP_API_URL=https://your-railway-domain.railway.app

# Firebase Config (from Firebase Console)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Stripe Publishable Key
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Sentry (Optional)
REACT_APP_SENTRY_DSN=your_frontend_sentry_dsn
```

### Step 3: Deploy Frontend
- [ ] Push your changes to GitHub
- [ ] Netlify will automatically deploy
- [ ] Check Netlify build logs for successful deployment
- [ ] Test your Netlify domain

## ✅ Post-Deployment Configuration

### Step 1: Update Cross-References
- [ ] Update `FRONTEND_URL` in Railway with your Netlify domain
- [ ] Update Stripe checkout URLs in Stripe Dashboard:
  - Success URL: `https://your-netlify-domain.netlify.app/payment-success`
  - Cancel URL: `https://your-netlify-domain.netlify.app/pricing`

### Step 2: Firebase Configuration
- [ ] Add your Netlify domain to Firebase Console > Authentication > Settings > Authorized domains
- [ ] Test Firebase authentication on your live site

### Step 3: Test Complete Flow
- [ ] User registration and login
- [ ] Subscription creation with test Stripe cards
- [ ] AI repair guide generation
- [ ] Email notifications
- [ ] Webhook processing (check Railway logs)

## ✅ Testing Live Payments

### Stripe Test Cards (for initial testing)
```
# Test successful payment
4242 4242 4242 4242

# Test declined payment
4000 0000 0000 0002

# Test 3D Secure
4000 0000 0000 3220
```

### Going Live with Real Payments
- [ ] Switch to Stripe live keys in Railway environment variables
- [ ] Update `REACT_APP_STRIPE_PUBLISHABLE_KEY` in Netlify to live key
- [ ] Test with real credit card (small amount)
- [ ] Monitor Railway logs for webhook processing
- [ ] Test subscription cancellation flow

## 🚨 Critical Notes

1. **Webhook Secret**: Make sure your Stripe webhook secret matches exactly
2. **CORS**: The Railway backend is configured to only accept requests from your Netlify domain in production
3. **Environment Variables**: Double-check all API keys are correct and have proper permissions
4. **Firebase Rules**: Ensure your Firestore security rules are production-ready
5. **Rate Limiting**: The app has rate limiting enabled - monitor if needed

## 🔧 Troubleshooting

If you encounter issues:

1. **Check Railway Logs**: Look for startup errors or runtime issues
2. **Check Netlify Build Logs**: Look for environment variable or build issues
3. **Check Browser Console**: Look for CORS or API errors
4. **Test API Endpoints**: Use curl or Postman to test Railway endpoints directly
5. **Webhook Issues**: Use Stripe webhook logs to debug

## 📊 Monitoring

After deployment:
- Monitor Railway resource usage
- Monitor Netlify build minutes and bandwidth
- Monitor OpenAI API usage and costs
- Monitor Stripe transaction logs
- Set up uptime monitoring for your Railway health endpoint

---

**Ready to start? Begin with the Backend Deployment section above!** 