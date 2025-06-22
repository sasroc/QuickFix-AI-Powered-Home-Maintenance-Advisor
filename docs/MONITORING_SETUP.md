# Monitoring & Analytics Setup Guide

## Overview

This guide covers the complete monitoring and analytics setup for QuickFix, including error tracking, performance monitoring, log aggregation, and uptime monitoring.

## 1. Error Tracking with Sentry

### Setup Steps

#### 1.1 Create Sentry Account and Projects

1. **Sign up for Sentry**: Go to [sentry.io](https://sentry.io) and create an account
2. **Create Backend Project**:
   - Click "Create Project"
   - Select "Node.js" platform
   - Name: `quickfix-backend`
   - Copy the DSN (Data Source Name)

3. **Create Frontend Project**:
   - Create another project
   - Select "React" platform
   - Name: `quickfix-frontend`
   - Copy the DSN

#### 1.2 Environment Variables

**Backend (.env):**
```bash
# Sentry Configuration
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_RELEASE=quickfix-backend@1.0.0
```

**Frontend (.env):**
```bash
# Sentry Configuration
REACT_APP_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
REACT_APP_SENTRY_RELEASE=quickfix-frontend@1.0.0
REACT_APP_VERSION=1.0.0
```

#### 1.3 Features Implemented

**Backend Error Tracking:**
- ✅ Automatic exception capture
- ✅ Performance monitoring with 10% sampling in production
- ✅ User context tracking (authenticated users)
- ✅ Request breadcrumbs
- ✅ Custom error filtering (excludes rate limits, validation errors)
- ✅ Enhanced error context (request details, user info)

**Frontend Error Tracking:**
- ✅ React error boundary integration
- ✅ Performance monitoring
- ✅ User session tracking
- ✅ Authentication error tracking
- ✅ Custom error filtering (excludes common browser errors)

#### 1.4 Error Categories Tracked

**Backend:**
- Unexpected server errors (500s)
- OpenAI API failures
- Firestore connection issues
- Stripe webhook errors
- Authentication failures

**Frontend:**
- React component errors
- Authentication failures
- API request failures
- Navigation errors
- User interaction errors

#### 1.5 Performance Metrics

**Backend:**
- API endpoint response times
- Database query performance
- OpenAI API latency
- Memory usage profiling

**Frontend:**
- Page load times
- Component render performance
- User interaction latency
- Bundle size impact

### Testing Sentry Integration

**Backend Test:**
```bash
# Trigger a test error
curl -X POST http://localhost:4000/api/test-error
```

**Frontend Test:**
- Open browser console
- Navigate to different pages
- Check Sentry dashboard for events

### Sentry Dashboard Features

1. **Issues**: Grouped errors with stack traces
2. **Performance**: Transaction monitoring and slow queries
3. **Releases**: Track deployments and error rates
4. **Alerts**: Email/Slack notifications for critical errors
5. **User Feedback**: Collect user reports for errors

## 2. Performance Monitoring (Next Steps)

### 2.1 New Relic Integration

**Benefits:**
- Application performance monitoring (APM)
- Infrastructure monitoring
- Real user monitoring (RUM)
- Database performance insights

**Setup Steps:**
1. Create New Relic account
2. Install New Relic agent:
   ```bash
   npm install newrelic
   ```
3. Add configuration:
   ```javascript
   // newrelic.js
   require('newrelic');
   ```

### 2.2 Alternative: DataDog

**Benefits:**
- Full-stack monitoring
- Log aggregation
- Infrastructure monitoring
- Custom dashboards

## 3. Log Aggregation (Winston Already Configured)

### 3.1 Current Winston Setup

**Features:**
- ✅ Structured logging with JSON format
- ✅ Multiple log levels (error, warn, info, debug)
- ✅ File rotation for production
- ✅ Console output for development
- ✅ Request/response logging

**Log Locations:**
- Development: Console output
- Production: `logs/` directory with rotation

### 3.2 Enhanced Log Aggregation Options

#### Option A: ELK Stack (Elasticsearch, Logstash, Kibana)
```bash
# Add elasticsearch winston transport
npm install winston-elasticsearch
```

#### Option B: Papertrail
```bash
# Add papertrail transport
npm install winston-papertrail
```

#### Option C: CloudWatch Logs (AWS)
```bash
# Add CloudWatch transport
npm install winston-cloudwatch
```

### 3.3 Log Enhancement

**Current Implementation:**
```javascript
// Enhanced logging with context
logger.info('AI request processed', {
  userId: user.uid,
  plan: user.plan,
  responseTime: Date.now() - startTime,
  model: 'gpt-4o'
});
```

## 4. Uptime Monitoring

### 4.1 UptimeRobot Setup

**Steps:**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors for:
   - Frontend: `https://yourdomain.com`
   - Backend API: `https://api.yourdomain.com/api/welcome`
   - Stripe webhooks: `https://api.yourdomain.com/api/webhook`

**Monitor Types:**
- HTTP(s) monitoring every 5 minutes
- Keyword monitoring for specific responses
- Port monitoring for database connections

### 4.2 Alternative: Pingdom

**Benefits:**
- More detailed performance metrics
- Global monitoring locations
- Advanced alerting options

### 4.3 Health Check Endpoints

**Backend Health Check:**
```javascript
// Add to app.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});
```

## 5. Custom Analytics Dashboard

### 5.1 Business Metrics to Track

**User Metrics:**
- Daily/Monthly Active Users
- User registration rate
- Subscription conversion rate
- Churn rate

**Feature Usage:**
- AI requests per day
- Popular repair categories
- Credit usage patterns
- Feature adoption rates

**Performance Metrics:**
- API response times
- Error rates by endpoint
- Cache hit ratios
- OpenAI API usage costs

### 5.2 Implementation Options

#### Option A: Custom Dashboard with Chart.js
```javascript
// React component for analytics
import { Chart as ChartJS } from 'chart.js';

const AnalyticsDashboard = () => {
  // Fetch metrics from backend
  // Display charts and KPIs
};
```

#### Option B: Grafana + InfluxDB
- Time-series database for metrics
- Beautiful dashboards
- Advanced alerting

#### Option C: Google Analytics + Custom Events
- Already partially implemented
- Free tier available
- Good for user behavior tracking

## 6. Alerting Strategy

### 6.1 Critical Alerts (Immediate Response)

**Sentry Alerts:**
- Server errors affecting > 10 users
- Payment processing failures
- Authentication system down

**Uptime Alerts:**
- Website down for > 2 minutes
- API response time > 5 seconds
- Database connection failures

### 6.2 Warning Alerts (Next Business Day)

- Error rate increase > 50%
- Slow API endpoints (> 2 seconds)
- High memory usage (> 80%)
- Low credit balances for users

### 6.3 Notification Channels

**Immediate:**
- SMS for critical issues
- Slack for team notifications
- Email for backup

**Non-Critical:**
- Daily/Weekly email summaries
- Slack digest messages

## 7. Deployment Monitoring

### 7.1 Release Tracking

**Sentry Releases:**
```bash
# Create release
sentry-cli releases new "quickfix-backend@1.2.0"

# Associate commits
sentry-cli releases set-commits "quickfix-backend@1.2.0" --auto

# Deploy
sentry-cli releases deploys "quickfix-backend@1.2.0" new -e production
```

**Benefits:**
- Track error rates per release
- Identify problematic deployments
- Automatic rollback triggers

### 7.2 Deployment Health Checks

**Post-Deployment Verification:**
1. Health endpoint responds
2. Database connectivity
3. External API connectivity (OpenAI, Stripe)
4. Authentication flow works
5. Critical user paths functional

## 8. Cost Optimization

### 8.1 Monitoring Costs

**Sentry:**
- Free tier: 5,000 errors/month
- Team plan: $26/month for 50,000 errors
- Monitor error volume to avoid overages

**New Relic:**
- Free tier: 100GB data/month
- Pro: $25/month per full user
- Use sampling to control data volume

### 8.2 Cost-Effective Alternatives

**Free/Low-Cost Options:**
- Sentry (free tier)
- UptimeRobot (free tier)
- Winston file logging
- Google Analytics
- Basic health checks

**Premium Options:**
- DataDog (comprehensive but expensive)
- New Relic (APM focused)
- Splunk (enterprise logging)

## 9. Security Monitoring

### 9.1 Security Events to Track

**Authentication:**
- Failed login attempts
- Password reset requests
- Account lockouts
- Suspicious login patterns

**API Security:**
- Rate limit violations
- Invalid API keys
- Unusual request patterns
- SQL injection attempts

### 9.2 Implementation

**Sentry Security Context:**
```javascript
// Track security events
Sentry.addBreadcrumb({
  message: 'Failed login attempt',
  category: 'security',
  data: {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    email: email
  },
  level: 'warning'
});
```

## 10. Compliance and Data Privacy

### 10.1 GDPR Compliance

**Sentry Configuration:**
- Enable data scrubbing for PII
- Set data retention policies
- Configure IP address anonymization

**Log Management:**
- Avoid logging sensitive data
- Implement log retention policies
- Secure log storage

### 10.2 Data Retention

**Sentry:**
- Error data: 30 days (free), 90 days (paid)
- Performance data: 30 days

**Logs:**
- Application logs: 30 days
- Security logs: 90 days
- Audit logs: 1 year

## 11. Testing and Validation

### 11.1 Error Tracking Tests

**Backend:**
```bash
# Test error capture
curl -X POST http://localhost:4000/api/test-sentry
```

**Frontend:**
```javascript
// Test error in React
const TestErrorButton = () => {
  const throwError = () => {
    throw new Error('Test error for Sentry');
  };
  return <button onClick={throwError}>Test Error</button>;
};
```

### 11.2 Performance Tests

**Load Testing:**
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 3 http://localhost:4000/api/ai/analyze
```

### 11.3 Monitoring Validation

**Checklist:**
- [ ] Errors appear in Sentry dashboard
- [ ] Performance metrics are collected
- [ ] User context is properly set
- [ ] Alerts are triggered appropriately
- [ ] Uptime monitoring is functional

## 12. Maintenance and Updates

### 12.1 Regular Tasks

**Weekly:**
- Review error trends
- Check performance metrics
- Validate alert configurations

**Monthly:**
- Update monitoring configurations
- Review cost and usage
- Test alert channels

**Quarterly:**
- Audit monitoring coverage
- Update retention policies
- Review security events

### 12.2 Monitoring the Monitors

**Meta-Monitoring:**
- Monitor Sentry quota usage
- Check log storage usage
- Validate alert delivery
- Test backup monitoring systems

## Conclusion

This comprehensive monitoring setup provides:
- **Error Tracking**: Sentry for both frontend and backend
- **Performance Monitoring**: Built-in with Sentry, expandable to New Relic
- **Log Aggregation**: Winston with multiple transport options
- **Uptime Monitoring**: UptimeRobot or similar services
- **Custom Analytics**: Extensible framework for business metrics

The implementation is production-ready with proper error handling, user privacy considerations, and cost optimization strategies. 