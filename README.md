# QuickFix AI - Your AI-Powered Home Maintenance Companion

QuickFix AI is an intelligent home maintenance advisor that transforms how homeowners and renters tackle repair issues. Using advanced AI technology, multimodal input processing, and interactive guidance, QuickFix empowers users to confidently handle repairs while knowing when to call professionals.

## 🏠 What QuickFix AI Does

QuickFix AI analyzes your home maintenance problems and provides personalized, step-by-step repair instructions. Whether you describe the issue in text, speak it aloud, or upload a photo, our AI understands your situation and delivers actionable solutions.

### 🎯 Core Value Proposition
- **Instant Expert Guidance**: Get professional-quality repair instructions in seconds
- **Multimodal Understanding**: Communicate your problem however is most convenient
- **Confidence Building**: Know exactly what to do, what tools you need, and when to call a pro
- **Cost Savings**: Avoid unnecessary service calls for simple repairs
- **Safety First**: Built-in safety warnings and professional recommendations

## ✨ Key Features

### 🤖 AI-Powered Repair Analysis
- **Advanced AI Models**: Uses OpenAI's GPT-4o technology for accurate problem diagnosis
- **Multimodal Input Support**: 
  - Text descriptions in natural language
  - Voice input with real-time speech recognition
  - Image uploads for visual problem analysis
- **Intelligent Response Generation**: Contextual repair guides tailored to your specific situation

### 📋 Interactive Repair Guides
- **Step-by-Step Instructions**: Clear, numbered steps with completion tracking
- **Tool & Material Checklists**: Comprehensive lists with checkbox tracking
- **Time Estimates**: Realistic completion timeframes for planning
- **Progress Tracking**: Visual progress bars and completion percentages
- **Safety Warnings**: Automated alerts for potentially dangerous situations

### 📱 User Experience Features
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Customizable interface themes
- **Repair History**: Save and revisit past repairs (plan-dependent limits)
- **Community Sharing**: Share success stories and before/after photos
- **Professional Referrals**: AI-powered recommendations for when to call experts

### 💳 Flexible Subscription Plans

#### Starter Plan - $9.99/month
- 25 AI analysis credits per month
- Basic repair guides
- 10 saved repair histories
- Community access

#### Pro Plan - $19.99/month  
- 100 AI analysis credits per month
- Enhanced repair guides with pro tips
- 50 saved repair histories
- Priority support
- Advanced AI models

#### Premium Plan - $39.99/month
- 500 AI analysis credits per month
- Premium repair guides with expert insights
- Unlimited repair histories
- Direct expert consultation
- Latest AI technology access

## 🔧 How It Works

### 1. Describe Your Issue
Users can input their repair problem using:
- **Text**: Natural language descriptions like "My kitchen sink is leaking under the cabinet"
- **Voice**: Speak directly to the app using Web Speech API
- **Images**: Upload photos for visual analysis of the problem

### 2. AI Analysis & Processing
- OpenAI models analyze the input using different tiers based on subscription
- System generates comprehensive repair guides with safety considerations
- Intelligent caching reduces response times for similar issues
- Credit system ensures fair usage across subscription tiers

### 3. Interactive Guidance
- Receive step-by-step instructions with completion tracking
- Check off tools and materials as you gather them
- Follow progress indicators to stay on track
- Access professional tips and safety warnings

### 4. Save & Share
- Repair guides automatically saved to history (within plan limits)
- Share success stories with the community
- Access past repairs for reference
- Export guides for offline use

## 🏗️ Technical Architecture

### Frontend Stack
- **React 19**: Modern React with latest features and performance optimizations
- **Chakra UI**: Professional component library for consistent design
- **Framer Motion**: Smooth animations and transitions
- **Firebase SDK**: Real-time authentication and data synchronization
- **Stripe.js**: Secure payment processing
- **Web Speech API**: Voice input capabilities

### Backend Stack
- **Node.js + Express**: High-performance server with TypeScript
- **OpenAI API**: Advanced AI models for repair analysis
- **Firebase Admin**: User management and Firestore operations
- **Stripe API**: Subscription and payment management
- **SendGrid**: Automated email notifications
- **Winston + Sentry**: Comprehensive logging and error tracking

### Key Technical Features
- **Intelligent Caching**: Multi-level caching for optimal performance
- **Rate Limiting**: Sophisticated rate limiting based on user type and subscription
- **Image Processing**: Automatic image compression and optimization
- **Real-time Sync**: Live updates of user data and subscription status
- **Security First**: Comprehensive security headers, CORS, and authentication

## 🚀 Production Deployment

This application is production-ready and deployed on:
- **Backend**: Railway (Node.js/Express with TypeScript)
- **Frontend**: Netlify (React with modern build pipeline)
- **Database**: Firebase Firestore
- **Payments**: Stripe with webhook integration
- **AI**: OpenAI GPT-4o models with intelligent caching

### Quick Deployment
1. **Backend (Railway)**: See `DEPLOYMENT_SETUP.md` for detailed setup
2. **Frontend (Netlify)**: Automatic deployment via `netlify.toml`

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- Firebase project setup
- OpenAI API key
- Stripe account (for payments)
- SendGrid account (for emails)

### Local Development
```bash
# Backend setup
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev

# Frontend setup  
cd frontend
npm install
cp .env.example .env  # Configure environment variables
npm start
```

## 📊 Business Model & Analytics

### Revenue Streams
- **Subscription Revenue**: Tiered monthly/annual plans
- **Affiliate Partnerships**: Tool and material vendor commissions
- **Professional Network**: Service provider referral fees
- **Premium Features**: Advanced AI models and expert consultations

### Key Metrics Tracking
- User engagement and repair completion rates
- Subscription conversion and retention rates
- AI accuracy and user satisfaction scores
- Credit usage patterns and optimization opportunities

## 📚 Documentation

### User Guides
- [Getting Started Guide](docs/USER_GUIDE.md)
- [Subscription Management](docs/SUBSCRIPTION_GUIDE.md)
- [Community Guidelines](docs/COMMUNITY_GUIDELINES.md)

### Technical Documentation
- [Complete Deployment Guide](DEPLOYMENT_SETUP.md)
- [System Architecture](docs/CONTEXT.md)
- [API Documentation](docs/API_REFERENCE.md)
- [Feedback System](docs/FEEDBACK_SYSTEM.md)
- [Firebase Security Setup](docs/FIREBASE_SECURITY_SETUP.md)
- [Caching Strategy](docs/CACHING_SYSTEM.md)
- [Rate Limiting](docs/RATE_LIMITING.md)

## 🔐 Environment Configuration

### Backend Environment (Railway)
```bash
NODE_ENV=production
PORT=4000
OPENAI_API_KEY=your_openai_api_key
FIREBASE_ADMIN_KEY=your_firebase_admin_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
SENDGRID_API_KEY=your_sendgrid_api_key
FRONTEND_URL=https://your-netlify-domain.netlify.app
```

### Frontend Environment (Netlify)
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

## 🧪 Testing & Quality Assurance

### Health Checks
- **Backend Health**: `https://your-railway-domain.railway.app/health`
- **API Endpoints**: Comprehensive CORS and authentication testing
- **Payment Flow**: End-to-end Stripe integration testing
- **Firebase Auth**: Production domain authentication verification

### Performance Monitoring
- Real-time error tracking with Sentry
- Comprehensive logging with Winston
- API performance metrics and optimization
- User analytics and engagement tracking

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request with detailed description

## 📞 Support & Community

- **Documentation**: Comprehensive guides in `/docs` folder
- **Issues**: GitHub issues for bug reports and feature requests
- **Community**: In-app community features for user interaction
- **Professional Support**: Available for Premium subscribers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ to make home maintenance accessible to everyone**