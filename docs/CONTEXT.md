# QuickFix: AI-Powered Home Maintenance Advisor

## Overview

QuickFix is a web application designed to assist homeowners and renters in resolving minor home maintenance issues using AI-powered guidance. By leveraging Hugging Face's multimodal models, a React-based frontend, and integrations like Google Maps API, QuickFix provides personalized, step-by-step repair instructions, tool suggestions, and animated visuals. The app aims to empower users to tackle repairs confidently while offering scalability for premium features and partnerships.

## App Flow

The following outlines the user journey and core interactions within the QuickFix app:

### 1. User Input

#### Description
Users start by describing the issue via text, voice, or image upload (e.g., "My sink is leaking" or uploading a photo of a broken shelf).

#### Interface
- A clean, full-screen input form with three options:
  - Text input field (for typing the issue)
  - Voice input button (records audio, converted to text via browser-based speech-to-text API)
  - Image upload button (accepts common formats like JPG, PNG)
- A "Submit" button to process the input

#### Backend Processing
- Text/voice inputs are processed by a Hugging Face NLP model to extract key details
- Image uploads are analyzed by a vision-language model to identify the problem
- The app combines text and image analysis to generate a precise understanding of the issue

### 2. Issue Analysis and Response Generation

#### Description
The AI processes the input to generate a tailored repair guide.

#### Backend Processing
- Hugging Face's Inference API is used to access pre-trained models
- NLP model generates clear, concise step-by-step instructions
- Vision model enhances instructions by identifying specific components
- System compiles a list of required tools and materials

#### Output
A structured JSON response containing:
- Step-by-step instructions (array of steps)
- List of tools/materials
- Estimated time for repair

### 3. Interactive Repair Guide

#### Description
The React frontend presents the repair guide in an interactive, user-friendly format.

#### Interface
- **Step-by-Step Guide**: Scrollable list of steps with completion checkboxes
- **Animated Visuals**: Framer Motion animations accompany each step
- **Tool/Material Checklist**: Sidebar with required items and store links
- **Progress Tracker**: Visual progress bar showing completion percentage

#### Features
- "Clarify" button for follow-up questions
- "Pause and Resume" feature with local progress saving

### 4. External Integrations

#### Local Store Suggestions
- Google Maps API integration for nearby hardware stores
- Displays store names, distances, and website links

#### Professional Help
- AI confidence score-based professional recommendations
- "Find a Pro" feature for local service providers

### 5. Community and Sharing

#### Description
Users can share their repair success stories and tips to build community engagement.

#### Interface
- "Community" tab for "before and after" content
- Moderation and issue-type tagging
- Upvoting and commenting functionality

#### Social Sharing
- Share button for X and TikTok
- Formatted posts with relevant hashtags

## Key Features

### Multimodal Input Processing
- Text, voice, and image input support
- Hugging Face's Idefics3 and LLaMA integration

### Interactive Repair Guides
- Animated step-by-step instructions
- Tool/material checklists with store links
- Progress tracking and Q&A support

### Scalable Architecture
- React with Tailwind CSS
- Hugging Face Spaces deployment
- Modular component design

### Community Engagement
- In-app community features
- Social media integration

### Professional Fallback
- AI-based complexity detection
- Professional service recommendations

## Technical Implementation

### Frontend

#### Framework and Libraries
- React with Tailwind CSS
- Framer Motion for animations
- React Router for navigation
- Web Speech API for voice input

#### Components
- InputForm
- RepairGuide
- CommunityTab
- StoreFinder

### Backend

#### AI Models and APIs
- Hugging Face Inference API
- Google Maps API
- Optional Firebase integration

#### Data Flow
- User input → Hugging Face API → JSON response → React frontend
- LocalStorage for progress tracking

### Deployment
- Hugging Face Spaces for rapid deployment
- Vercel/Netlify for production hosting

## Scalability and Monetization

### Premium Features
- Subscription-based advanced guides
- Priority support and live AI assistance

### Partnerships
- Hardware brand affiliate links
- Sponsored guides

### Professional Network
- Vetted professional database
- Commission-based referral system

## Development Roadmap

### Phase 1: MVP (1-2 months)
- Core input processing
- React frontend development
- Google Maps integration
- Hugging Face Spaces deployment

### Phase 2: Community Features (1 month)
- Community tab implementation
- Social sharing functionality

### Phase 3: Monetization and Scaling (2-3 months)
- Premium subscription system
- Partnership establishment
- Performance optimization

## Notes for Developers

### Best Practices
- Secure API key storage
- Comprehensive error handling
- WCAG 2.1 compliance
- Jest and Cypress testing
- Client-side image optimization

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);
```

### Repair Issues Table
```sql
CREATE TABLE repair_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ai_confidence_score FLOAT,
    complexity_level VARCHAR(50)
);
```

### Repair Steps Table
```sql
CREATE TABLE repair_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repair_issue_id UUID REFERENCES repair_issues(id),
    step_number INTEGER NOT NULL,
    description TEXT NOT NULL,
    estimated_time INTEGER, -- in minutes
    tools_required TEXT[],
    materials_required TEXT[],
    image_url VARCHAR(255),
    animation_url VARCHAR(255)
);
```

### User Progress Table
```sql
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    repair_issue_id UUID REFERENCES repair_issues(id),
    step_id UUID REFERENCES repair_steps(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    UNIQUE(user_id, repair_issue_id, step_id)
);
```

### Community Posts Table
```sql
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    repair_issue_id UUID REFERENCES repair_issues(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    before_image_url VARCHAR(255),
    after_image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    likes_count INTEGER DEFAULT 0
);
```

### Comments Table
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    parent_comment_id UUID REFERENCES comments(id)
);
```

### Professional Services Table
```sql
CREATE TABLE professional_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    contact_info JSONB,
    rating DECIMAL(3,2),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Project Structure

```
quickfix/
├── .github/                    # GitHub Actions workflows
├── docs/                       # Documentation
│   ├── CONTEXT.md
│   └── API.md
├── frontend/                   # React frontend application
│   ├── public/                 # Static files
│   │   ├── assets/            # Images, fonts, etc.
│   │   │   ├── src/
│   │   │   │   ├── assets/        # Images, fonts, etc.
│   │   │   │   ├── components/    # Reusable React components
│   │   │   │   │   ├── common/    # Shared components
│   │   │   │   │   ├── forms/     # Form components
│   │   │   │   │   ├── layout/    # Layout components
│   │   │   │   │   └── repair/    # Repair-specific components
│   │   │   │   │   └── contexts/  # React contexts
│   │   │   │   │   └── hooks/     # Custom React hooks
│   │   │   │   │   └── pages/     # Page components
│   │   │   │   │   └── services/  # API services
│   │   │   │   │   └── styles/    # Global styles
│   │   │   │   │   └── types/     # TypeScript types
│   │   │   │   │   └── utils/     # Utility functions
│   │   │   │   │   └── App.tsx
│   │   │   │   │   └── index.tsx
│   │   │   │   ├── package.json
│   │   │   │   └── tsconfig.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── backend/                # Node.js backend application
│   │   ├── src/
│   │   │   ├── config/        # Configuration files
│   │   │   ├── controllers/   # Route controllers
│   │   │   ├── middleware/    # Custom middleware
│   │   │   ├── models/        # Database models
│   │   │   ├── routes/        # API routes
│   │   │   ├── services/      # Business logic
│   │   │   ├── utils/         # Utility functions
│   │   │   └── app.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── shared/               # Shared code between frontend and backend
│   │   ├── constants/
│   │   ├── types/
│   │   └── utils/
│   ├── scripts/              # Build and deployment scripts
│   ├── .env.example         # Example environment variables
│   ├── .gitignore
│   ├── docker-compose.yml   # Docker configuration
│   └── README.md
```

### Key Directories Explained

#### Frontend
- `components/`: Reusable UI components organized by feature
- `contexts/`: React context providers for state management
- `hooks/`: Custom React hooks for shared logic
- `services/`: API integration and external service calls
- `pages/`: Top-level page components
- `utils/`: Helper functions and utilities

#### Backend
- `controllers/`: Request handlers and business logic
- `middleware/`: Custom Express middleware
- `models/`: Database models and schemas
- `routes/`: API route definitions
- `services/`: Business logic and external service integration

#### Shared
- `constants/`: Shared constants and configuration
- `types/`: TypeScript type definitions
- `utils/`: Shared utility functions

### Development Workflow

1. **Local Development**
   - Frontend runs on port 3000
   - Backend runs on port 4000
   - PostgreSQL runs on port 5432
   - Redis runs on port 6379

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Set up required API keys
   - Configure database connections

3. **Running the Application**
   ```bash
   # Install dependencies
   npm install

   # Start development servers
   npm run dev
   ```

4. **Testing**
   - Frontend: `npm run test` in frontend directory
   - Backend: `npm run test` in backend directory
   - E2E: `npm run test:e2e` in root directory

## QuickFix-Local System Overview

**Primary Function**: AI-powered repair guide generator
**Architecture**: React frontend + Node.js backend + Firebase/Firestore + Stripe

### Core Components

// ... existing code ...

## Lifetime Access Feature

QuickFixAI includes a special **Lifetime Access** feature that provides permanent access to Starter plan features without any billing or subscription requirements.

### Features of Lifetime Access
- **Permanent Access**: Never expires, no billing cycles
- **Starter Plan Benefits**: 10 credits, 10 repair histories  
- **Monthly Credit Reset**: Credits automatically reset to 10 every month
- **No Stripe Integration**: Completely bypasses all payment processing
- **Admin-Only Granting**: Can only be enabled by direct database modification

### Technical Implementation

**Database Schema:**
- `hasLifetimeAccess`: Boolean field in user documents
- `lastCreditReset`: Timestamp tracking last monthly reset
- Firestore rules updated to validate these fields

**Access Control:**
- Lifetime users bypass all subscription checks
- Protected from Stripe webhook interference  
- Always treated as having "starter" plan access

**Credit Management:**
- Monthly automatic credit reset to 25
- Admin endpoints for manual credit resets
- Eligibility checks prevent multiple resets per month

### Granting Lifetime Access

**Manual Process (Admin Only):**
1. Access Firestore console or use admin tools
2. Navigate to user document: `/users/{userId}`
3. Add field: `hasLifetimeAccess: true`
4. Optionally add: `lastCreditReset: null` (for immediate credit reset)
5. User will have lifetime access on next app reload

**Admin API Endpoints:**
- `POST /admin/reset-lifetime-credits` - Reset all lifetime user credits
- `POST /admin/reset-user-credits/{uid}` - Reset specific user credits

### System Behavior

**UI Changes:**
- Special "♾️ Lifetime Access" badge in RepairPage  
- "Lifetime Access" status in AccountSettings
- Upgrade button hidden for lifetime users
- Distinct styling with green glow animations

**Backend Protection:**
- All Stripe webhooks skip lifetime users
- Credit reset system runs monthly via cron
- Subscription logic bypassed for lifetime users

This feature is designed for special promotions, employee access, or VIP user rewards while maintaining full system security and preventing any billing conflicts.
