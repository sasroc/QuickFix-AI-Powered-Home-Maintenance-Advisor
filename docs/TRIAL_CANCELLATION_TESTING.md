# Trial Cancellation Grace Period Testing Guide

## Overview
When users start a free trial and then cancel their subscription, they should have 24 hours of continued access to the repair functionality before losing access completely.

## How It Works

### For Trial Users Who Cancel:
1. **Immediate cancellation**: Trial users can cancel anytime during their trial
2. **24-hour grace period**: After cancellation, they retain access for 24 hours
3. **Automatic cleanup**: After 24 hours, access is automatically revoked
4. **Warning notification**: Users see a countdown warning during the grace period

### For Regular Subscribers:
- Regular subscribers follow normal cancellation flow (no special grace period)
- Only applies to users who started with a free trial

## Testing Steps

### 1. Start a Free Trial
```bash
# Start frontend and backend
npm start
```

1. Go to `/pricing`
2. Click "Start My Free Trial" 
3. Complete signup and Stripe checkout (use test card: `4242 4242 4242 4242`)
4. Verify access to `/repair` page

### 2. Cancel the Trial
1. Go to Account Settings or click "Manage Subscription"
2. Cancel the subscription in Stripe portal
3. Verify user still has access to `/repair` page
4. Should see grace period warning banner

### 3. Verify Grace Period Access
- User should see warning: "You have X hours and Y minutes remaining..."
- `/repair` functionality should still work
- User can still generate repair guides

### 4. Test Automatic Cleanup

#### Option A: Wait 24 Hours (Real Test)
- Wait 24 hours after cancellation
- User should lose access to `/repair`
- Should be redirected to pricing page

#### Option B: Manual Testing (Quick Test)
For testing purposes, you can manually trigger cleanup:

```bash
# Call admin cleanup endpoint (requires admin user)
curl -X POST http://localhost:4000/api/admin/cleanup-expired-trials \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

Or modify the grace period duration in `frontend/src/utils/trialUtils.js`:
```javascript
// Change 24 hours to 1 minute for testing
return hoursSinceCancellation < 0.0167; // 1 minute instead of 24 hours
```

## Expected Behavior

### Active Trial User
- ✅ Access to `/repair`
- ✅ Can generate repair guides
- ✅ No warning banners

### Cancelled Trial User (Within 24 Hours)
- ✅ Access to `/repair` 
- ✅ Can generate repair guides
- ⚠️ Warning banner showing time remaining
- ⚠️ "Trial Access Ending Soon" notification

### Cancelled Trial User (After 24 Hours)
- ❌ No access to `/repair`
- ❌ Redirected to pricing page
- ❌ Plan reset to 'none'
- ❌ Credits reset to 0

### Regular Subscriber Who Cancels
- Follows normal subscription cancellation flow
- No special grace period (standard end-of-billing-period access)

## Database Fields

### New Fields Added:
- `wasOnTrial`: Boolean indicating user was on trial
- `trialCancelledAt`: Timestamp when trial was cancelled
- `trialExpiredAt`: Timestamp when grace period ended

### Usage Example:
```javascript
// Frontend - Check grace period access
import { hasTrialGracePeriodAccess, getTrialGracePeriodRemaining } from '../utils/trialUtils';

const hasAccess = hasTrialGracePeriodAccess(userData);
const gracePeriod = getTrialGracePeriodRemaining(userData);

if (gracePeriod?.hasTimeLeft) {
  console.log(`${gracePeriod.hoursRemaining} hours remaining`);
}
```

## Troubleshooting

### User Still Has Access After 24 Hours
1. Check if cleanup function is running
2. Manually call cleanup endpoint
3. Check user's `trialCancelledAt` timestamp in Firestore

### Warning Banner Not Showing
1. Verify user has `wasOnTrial: true` and `trialCancelledAt` timestamp
2. Check frontend console for errors
3. Ensure `trialUtils.js` functions are working correctly

### User Loses Access Immediately
1. Check webhook is properly setting `trialCancelledAt` field
2. Verify `SubscriptionGate` is using new logic
3. Check for errors in browser console

## Test Cards (Stripe Test Mode)
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- Use any future expiry date and any 3-digit CVC

## Admin Functions

### Manual Cleanup (Admin Only)
```bash
POST /api/admin/cleanup-expired-trials
Authorization: Bearer <admin_token>
```

### Check Individual User Status
The system automatically checks and updates user status when they access the repair system, so manual checking is rarely needed 