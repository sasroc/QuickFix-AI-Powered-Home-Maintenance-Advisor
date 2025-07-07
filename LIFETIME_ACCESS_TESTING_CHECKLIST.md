# 🧪 Lifetime Access Feature - Testing Checklist

## **Pre-Deployment Testing Checklist**

Complete each section before moving to production. Check off items as you test them.

---

## **Phase 1: Environment Setup**

- [✅ ] Frontend compiles without errors or warnings
- [ ✅] Backend starts without errors  
- [✅ ] Database connection working (Firebase/Firestore)
- [✅ ] Admin authentication configured and working
- [✅ ] Stripe webhooks configured (if testing webhooks)

---

## **Phase 2: Basic Lifetime Access Functionality**

### **2.1 Granting Lifetime Access**
- [✅ ] Manual Firebase Console: Add `hasLifetimeAccess: true` to test user
- [✅ ] User document updated successfully in Firestore
- [✅ ] No errors in Firebase Console

### **2.2 Frontend Access Control**
- [ ✅] Login as lifetime user → Can access repair page
- [ ✅] "♾️ Lifetime Access" badge appears in RepairPage
- [ ✅] Green glow animation working on badge
- [✅ ] Upgrade button hidden for lifetime users
- [✅ ] Credits show "25/25" (starter plan allocation)

### **2.3 Account Settings Display**
- [ ✅] Status shows "Lifetime Access" with proper styling
- [✅ ] "No billing - Lifetime access" message appears
- [ ✅] Lifetime badge with green styling displays
- [✅ ] No subscription management buttons shown

---

## **Phase 3: Credit System Testing**

### **3.1 Initial Credit Allocation**
- [✅ ] New lifetime user (0 credits) → Auto-gets 25 credits on page load
- [✅ ] Console log: `"Auto-allocating starter credits for new lifetime user"`
- [✅ ] Credits update to 25/25 in UI
- [ ✅] Database updated with credits: 25, plan: "starter"

### **3.2 Credit Usage**
- [✅ ] Generate 1-2 repairs → Credits decrease properly
- [✅ ] Credits persist across page refreshes
- [✅ ] Can continue using repair features until 0 credits

### **3.3 Monthly Reset (Manual Test)**
```bash
curl -X POST http://localhost:3001/api/admin/reset-user-credits/USER_UID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
- [✅ ] API returns success message
- [✅ ] Credits reset to 25 in database and UI
- [ ✅] lastCreditReset timestamp updated
- [✅ ] Console log: Success message

### **3.4 Monthly Reset (Simulated)**
```bash
curl -X POST http://localhost:3001/api/admin/test-simulate-month-passage/USER_UID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
- [✅ ] API returns success → Credits set to 10, lastCreditReset set to 2 months ago
- [✅ ] Refresh repair page → Credits auto-reset to 25
- [✅ ] Console log: `"Auto-resetting monthly credits for lifetime user"`

---

## **Phase 4: Access Control & Security**

### **4.1 Subscription Gate Bypass**
- [✅ ] Lifetime user → Bypasses all subscription prompts
- [✅ ] Protected pages accessible without subscription
- [✅ ] No trial eligibility → Correct ineligibility reason shown

### **4.2 Trial System Protection**
- [ ✅] Lifetime user cannot start trials
- [✅ ] Correct error message: "lifetime_access" reason
- [✅ ] No trial buttons/flows accessible

### **4.3 Firestore Security Rules**
- [✅ ] Regular user cannot set `hasLifetimeAccess: true`
- [✅ ] Lifetime user can read/write their own data
- [✅ ] hasLifetimeAccess field validates as boolean

---

## **Phase 5: Regular Subscriber Testing**

### **5.1 Monthly Subscribers (if possible)**
- [✅ ] Create test monthly subscription (or simulate)
- [✅ ] Credits reset on billing cycle
- [✅ ] Console logs show renewal reset messages

### **5.2 Annual Subscribers**
```bash
curl -X POST http://localhost:3001/api/admin/test-simulate-annual-month-passage/ANNUAL_USER_UID
curl -X POST http://localhost:3001/api/admin/reset-annual-user-credits/ANNUAL_USER_UID
```
- [✅ ] Simulation succeeds → Credits reduced, lastCreditReset set to past
- [✅ ] Manual reset succeeds → Credits reset to plan allocation
- [✅ ] Frontend auto-reset → Refresh page resets credits automatically

### **5.3 Trial Users (Control Test)**
- [✅ ] Normal trial user → Can start trial normally
- [✅ ] Trial expiration → Access revoked properly
- [✅ ] Trial to paid → Credits allocated properly

---

## **Phase 6: Stripe Integration Protection**

### **6.1 Webhook Protection (if testable)**
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```
- [✅ ] Webhook events for lifetime users are skipped
- [✅ ] Console logs: `"Skipping Stripe update for lifetime user"`
- [✅ ] Database unchanged for lifetime users
- [✅ ] Response: `{"received": true, "skipped": "lifetime_user"}`

### **6.2 Billing Portal Protection**
- [ ] Lifetime users → Should not access Stripe billing portal
- [✅ ] No subscription management buttons in AccountSettings

---

## **Phase 7: Admin API Testing**

### **7.1 Lifetime User Endpoints**
```bash
curl -X POST http://localhost:3001/api/admin/reset-lifetime-credits
curl -X POST http://localhost:3001/api/admin/reset-user-credits/USER_UID  
curl -X POST http://localhost:3001/api/admin/test-simulate-month-passage/USER_UID
```
- [ ] Bulk reset → All lifetime users get credits reset
- [✅ ] Individual reset → Specific user gets credits reset  
- [✅ ] Simulation → Time passage simulated correctly
- [✅ ] Proper error handling → Invalid UIDs rejected

### **7.2 Annual Subscriber Endpoints**
```bash
curl -X POST http://localhost:3001/api/admin/reset-annual-credits
curl -X POST http://localhost:3001/api/admin/reset-annual-user-credits/USER_UID
curl -X POST http://localhost:3001/api/admin/test-simulate-annual-month-passage/USER_UID
```
- [ ] Bulk annual reset → All annual users get monthly reset
- [✅ ] Individual annual reset → Specific annual user reset
- [ ✅] Annual simulation → Time passage simulated for annual users

---

## **Phase 8: Edge Cases & Error Handling**

### **8.1 Invalid Scenarios**
- [✅ ] Invalid user UID → Proper error response
- [✅ ] Non-lifetime user → Proper rejection for lifetime endpoints
- [✅ ] Non-annual user → Proper rejection for annual endpoints
- [ ✅] Already reset this month → Proper rejection message

### **8.2 Mixed User Types**
- [ ] Multiple user types in database → Only appropriate users affected by bulk resets
- [ ] Lifetime + Annual + Monthly users → Each type handled correctly

### **8.3 Database Consistency**
- [ ] lastCreditReset field → Properly updated on resets
- [ ] Credits field → Never goes negative
- [ ] Plan field → Maintained correctly for lifetime users

---

## **Phase 9: Frontend Integration**

### **9.1 UI Consistency**
- [✅ ] All lifetime indicators show consistently across pages
- [ ] Responsive design → Works on mobile/tablet
- [✅ ] Dark mode → Lifetime badges work in dark theme
- [✅ ] Animation performance → No lag or visual glitches

### **9.2 State Management**
- [ ✅] Page refreshes → State persists correctly
- [✅ ] Real-time updates → Credits update without page refresh
- [ ✅] Cache invalidation → Changes reflect immediately

---

## **Phase 10: Performance & Monitoring**

### **10.1 Performance Checks**
- [✅ ] Page load time → No significant increase
- [✅ ] Database queries → Efficient (no excessive reads/writes)
- [✅ ] Memory usage → No memory leaks in frontend

### **10.2 Logging & Monitoring**
- [ ] Console logs → Clear and informative
- [ ] Error handling → Graceful degradation
- [ ] Success messages → Proper confirmation

---

## **🎯 Quick Test Commands Reference**

### **Lifetime User Testing**
```bash
# Simulate month passage for lifetime user
curl -X POST http://localhost:3001/api/admin/test-simulate-month-passage/USER_UID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Reset lifetime user credits
curl -X POST http://localhost:3001/api/admin/reset-user-credits/USER_UID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Bulk reset all lifetime users
curl -X POST http://localhost:3001/api/admin/reset-lifetime-credits \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### **Annual Subscriber Testing**
```bash
# Simulate month passage for annual user
curl -X POST http://localhost:3001/api/admin/test-simulate-annual-month-passage/ANNUAL_USER_UID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Reset annual user credits
curl -X POST http://localhost:3001/api/admin/reset-annual-user-credits/ANNUAL_USER_UID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Bulk reset all annual users
curl -X POST http://localhost:3001/api/admin/reset-annual-credits \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## **📋 Final Production Readiness Checklist**

- [✅ ] All Phase 1-10 tests completed successfully
- [✅ ] No errors in browser console during testing
- [✅ ] No errors in backend logs during testing
- [✅ ] Database integrity verified (no corrupted data)
- [✅ ] Performance acceptable (no significant slowdowns)
- [ ] Documentation updated (CONTEXT.md reflects changes)
- [✅ ] Admin access confirmed (can grant lifetime access)
- [ ] Test endpoints commented out/removed for production

---

## **🚀 Pre-Commit Steps**

- [ ] Remove/Comment test endpoints in `admin.routes.ts`:
  - `test-simulate-month-passage`
  - `test-simulate-annual-month-passage`

- [ ] Final code review:
  - [ ] No TODO comments left
  - [ ] No debug console.logs in production paths
  - [ ] All imports used

- [ ] Environment variables check:
  - [ ] All required ENV vars documented
  - [ ] No hardcoded secrets

---

## **Testing Notes & Issues**

Use this space to document any issues found during testing:

### **Issues Found:**
- [ ] Issue 1: _Description and resolution_
- [ ] Issue 2: _Description and resolution_

### **Test Environment Details:**
- Node.js version: _____
- Browser tested: _____
- Database: _____
- Test user UID: _____

---

## **✅ Sign-off**

- [ ] **Developer Testing Complete** - Date: _____ - Initials: _____
- [ ] **All Critical Issues Resolved** - Date: _____ - Initials: _____
- [ ] **Ready for Production Deployment** - Date: _____ - Initials: _____

---

**🎯 Once all checkboxes are complete, you're ready to create the patch file and deploy to production!** 