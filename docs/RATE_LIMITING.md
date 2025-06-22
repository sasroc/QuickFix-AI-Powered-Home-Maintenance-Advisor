# Rate Limiting Implementation

## Overview

QuickFix implements comprehensive rate limiting to protect against abuse, ensure fair usage, and maintain service quality. The rate limiting system uses `express-rate-limit` with custom configurations for different endpoint types.

## Rate Limiting Strategy

### 1. Global Rate Limiting
- **Limit**: 2,000 requests per 15 minutes per IP
- **Purpose**: Last resort protection against DDoS attacks
- **Applied to**: All API endpoints

### 2. AI Analysis Rate Limiting (Most Restrictive)
- **Authenticated Users**: 20 requests per 15 minutes
- **Anonymous Users**: 5 requests per 15 minutes
- **Purpose**: Protect expensive OpenAI API calls
- **Applied to**: `/api/ai/analyze`
- **Key Features**:
  - Combines user ID and IP for accurate tracking
  - Higher limits for authenticated users
  - Skips failed requests (doesn't penalize server errors)

### 3. Feedback & Support Rate Limiting
- **Limit**: 10 submissions per hour
- **Purpose**: Prevent spam while allowing legitimate feedback
- **Applied to**: 
  - `/api/feedback/submit`
  - `/api/support/contact`

### 4. Admin Rate Limiting
- **Limit**: 100 requests per 5 minutes
- **Purpose**: Protect admin operations
- **Applied to**: All admin endpoints in feedback routes

### 5. Webhook Rate Limiting
- **Limit**: 50 requests per minute
- **Purpose**: Handle high-frequency Stripe webhook calls
- **Applied to**: `/api/webhook/*`
- **Key Features**: Uses IP-only tracking (no user context)

### 6. General API Rate Limiting
- **Authenticated Users**: 1,000 requests per 15 minutes
- **Anonymous Users**: 100 requests per 15 minutes
- **Purpose**: Standard protection for most endpoints
- **Applied to**: Stripe, subscription, and welcome endpoints

## Implementation Details

### Key Generator Strategy
```typescript
// Combines user ID and IP for accurate rate limiting
const createKeyGenerator = (prefix: string) => {
  return (req: Request): string => {
    const userId = req.user?.uid || 'anonymous';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `${prefix}:${userId}:${ip}`;
  };
};
```

### Custom Error Handling
All rate limiters return consistent error responses:
```json
{
  "error": "Too many requests",
  "message": "You have exceeded the rate limit. Please try again later.",
  "retryAfter": 1234567890
}
```

### Authentication Integration
Rate limiting works seamlessly with Firebase authentication:
- Uses `decodeToken` middleware to identify users
- Provides higher limits for authenticated users
- Falls back to IP-based limiting for anonymous users

## Rate Limit Headers

The system includes standard rate limit headers in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoint-Specific Configuration

### AI Analysis (`/api/ai/analyze`)
```typescript
// Most restrictive - protects expensive AI calls
windowMs: 15 * 60 * 1000, // 15 minutes
max: req.user ? 20 : 5,    // 20 auth / 5 anonymous
```

### Feedback & Support
```typescript
// Moderate - prevents spam
windowMs: 60 * 60 * 1000,  // 1 hour
max: 10,                   // 10 submissions
```

### General API
```typescript
// Lenient - normal usage
windowMs: 15 * 60 * 1000,  // 15 minutes
max: req.user ? 1000 : 100, // 1000 auth / 100 anonymous
```

## Monitoring and Logging

### Rate Limit Violations
- All rate limit violations are logged with:
  - User ID (if authenticated)
  - IP address
  - Endpoint accessed
  - Timestamp
  - Current limit and usage

### Analytics Integration
Rate limiting events are tracked for:
- Usage pattern analysis
- Abuse detection
- Capacity planning

## Production Considerations

### Environment-Specific Limits
Consider adjusting limits based on environment:
```typescript
const isProduction = process.env.NODE_ENV === 'production';
const aiLimit = isProduction ? { auth: 20, anon: 5 } : { auth: 100, anon: 50 };
```

### Redis Integration (Future Enhancement)
For distributed deployments, consider Redis store:
```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'redis';

const redisClient = Redis.createClient();
const store = new RedisStore({
  client: redisClient,
  prefix: 'rl:',
});
```

### Load Balancer Considerations
- Ensure `trust proxy` is configured
- Use `X-Forwarded-For` headers correctly
- Consider sticky sessions for consistent user experience

## Security Benefits

1. **DDoS Protection**: Global rate limiting prevents overwhelming the server
2. **Cost Control**: AI rate limiting prevents expensive API abuse
3. **Spam Prevention**: Feedback/support limiting prevents spam submissions
4. **Fair Usage**: Ensures resources are shared fairly among users
5. **Service Quality**: Maintains response times under load

## Testing Rate Limits

### Manual Testing
```bash
# Test AI endpoint rate limiting
for i in {1..25}; do
  curl -X POST http://localhost:4000/api/ai/analyze \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"issue": "test"}' \
    && echo " - Request $i"
done
```

### Automated Testing
```javascript
// Jest test example
describe('Rate Limiting', () => {
  it('should enforce AI rate limits', async () => {
    const requests = Array(25).fill().map(() => 
      request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({ issue: 'test' })
    );
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **Rate limits too restrictive**: Adjust limits based on user feedback
2. **False positives**: Check IP detection and proxy configuration
3. **Memory usage**: Consider Redis for high-traffic applications
4. **User experience**: Provide clear error messages and retry guidance

### Monitoring Commands
```bash
# Check rate limit violations in logs
grep "rate limit exceeded" /var/log/quickfix/app.log

# Monitor memory usage
node --inspect --max-old-space-size=4096 app.js
```

## Future Enhancements

1. **Dynamic Rate Limiting**: Adjust limits based on server load
2. **User-Specific Limits**: Different limits for different subscription tiers
3. **Geographic Limits**: Different limits by region
4. **Machine Learning**: Detect and prevent sophisticated abuse patterns
5. **Real-time Monitoring**: Dashboard for rate limit metrics

## Configuration Summary

| Endpoint Type | Window | Auth Limit | Anon Limit | Purpose |
|---------------|--------|------------|------------|---------|
| Global | 15 min | 2000 | 2000 | DDoS Protection |
| AI Analysis | 15 min | 20 | 5 | Cost Control |
| Feedback/Support | 1 hour | 10 | 10 | Spam Prevention |
| Admin | 5 min | 100 | N/A | Admin Protection |
| Webhooks | 1 min | 50 | 50 | Webhook Handling |
| General API | 15 min | 1000 | 100 | Standard Protection | 