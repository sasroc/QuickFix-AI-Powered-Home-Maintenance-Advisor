# Firebase Security Rules Testing Checklist

## 🧪 **Pre-Testing Setup**

### **1. Clear Browser Data**
- Clear browser cache and cookies
- Open DevTools → Console tab
- Watch for any Firebase permission errors

### **2. Test Environment**
- Use your development/staging environment first
- Have Firebase Console open: https://console.firebase.google.com/project/quickfixai-286ae/firestore
- Monitor Firestore activity in real-time

## 🔐 **Authentication Flow Testing**

### **✅ User Registration & Login**
- [✅ ] **New User Registration**: Create a new account
- [✅ ] **Email/Password Login**: Test existing user login
- [✅ ] **Google OAuth Login**: Test Google sign-in
- [✅ ] **User Profile Creation**: Verify user document is created in Firestore
- [✅ ] **Display Name Update**: Test profile updates (FIXED: Now updates both Auth and Firestore)

**Expected Behavior:**
- User document created in `/users/{uid}` collection
- Default fields: `email`, `displayName`, `subscriptionStatus`, `credits`, `isAdmin`
- No permission errors in console

## 💳 **Subscription & Credits Testing**

### **✅ Credit System**
- [✅ ] **View Credits**: Check credits display on repair page
- [✅ ] **Credit Deduction**: Submit a repair request and verify credit decreases
- [✅ ] **Zero Credits**: Test behavior when credits reach 0
- [✅ ] **Subscription Status**: Verify subscription gating works

**Expected Behavior:**
- Credits visible and accurate
- Repair requests blocked when credits = 0
- Subscription status properly checked

## 🔧 **Repair System Testing**

### **✅ Repair Creation & History**
- [✅ ] **Create Repair**: Submit text-only repair request (FIXED: Security rules updated for proper data validation)
- [✅ ] **Create Repair with Image**: Submit repair with image upload
- [✅ ] **View Repair History**: Access `/repair/history`
- [✅ ] **View Individual Repair**: Click on specific repair
- [✅ ] **Delete Repair**: Try deleting a repair from history

**Expected Behavior:**
- Repairs saved to `/repairs/{repairId}` collection
- Only user's own repairs visible
- Repair data structure validated
- Images properly compressed and stored

**🚨 Test These Potential Issues:**
- Large image uploads (>5MB)
- ✅Very long repair descriptions
- ✅Special characters in repair titles

## 👥 **Community Features Testing**

### **✅ Community Posts (Subscription Required)**
- [✅ ] **View Community**: Access `/community` page (should work for all)
- [✅ ] **Create Post (No Subscription)**: Try creating post without active subscription
- [✅ ] **Create Post (With Subscription)**: Test with active subscription
- [✅ ] **Like/Unlike Posts**: Test interaction features
- [✅ ] **Delete Own Post**: Test post deletion
- [✅ ] **View Others' Posts**: Ensure you can see but not edit others' posts

**Expected Behavior:**
- Anyone can view community posts
- Only subscribed users can create posts
- Users can only edit/delete their own posts
- Like functionality works properly

## 💬 **Feedback System Testing**

### **✅ Feedback Submission**
- [✅  ] **Bug Report**: Submit a bug report with screenshots
- [✅  ] **Feature Request**: Submit a feature request
- [✅  ] **General Feedback**: Submit general feedback
- [✅ ] **Anonymous Feedback**: Test without being logged in
- [✅ ] **View Own Feedback**: Check if you can see your submitted feedback

**Expected Behavior:**
- ✅All feedback types accepted
- ✅Anonymous feedback allowed
- ✅Screenshots upload properly (max 5 images)
- ✅Email notifications sent (check your email)

## 👨‍💼 **Admin Features Testing**

### **✅ Admin Dashboard** (Only if you have admin access)
- [✅ ] **Access Admin Dashboard**: Go to `/admin/feedback`
- [✅ ] **View All Feedback**: See all submitted feedback
- [✅] **Update Feedback Status**: Change feedback from 'new' to 'in_progress'
- [✅ ] **Add Admin Response**: Add a response to feedback
- [✅ ] **Filter Feedback**: Test filtering by status, type, priority

**Expected Behavior:**
- ✅Only admin users can access
- ✅All feedback visible and manageable
- ✅Status updates work properly

## 🚨 **Security Testing** (Verify Rules Are Working)

### **✅ Unauthorized Access Attempts**
- [✅ ] **Access Other User's Repairs**: Try to access another user's repair URL
- [✅ ] **Modify Other User's Data**: Attempt to edit another user's profile
- [✅ ] **Create Posts Without Subscription**: Try community post creation
- [✅ ] **Access Admin Routes**: Try accessing admin pages as regular user

**Expected Behavior:**
- All unauthorized attempts should be blocked
- Console should show "Missing or insufficient permissions" errors
- User should see appropriate error messages

## 🔍 **Data Validation Testing**

### **✅ Invalid Data Attempts**
- [✅ ] **Oversized Fields**: Try submitting very long repair titles (>200 chars)
- [✅ ] **Invalid Email**: Try updating profile with invalid email
- [✅ ] **Negative Credits**: Try setting negative credits (should be blocked)
- [✅ ] **Invalid Subscription Status**: Try setting invalid subscription status

**Expected Behavior:**
- All invalid data should be rejected
- Proper error messages displayed
- Data integrity maintained

## 📊 **Performance Testing**

### **✅ Query Performance**
- [✅ ] **Repair History Loading**: Check if repair history loads quickly
- [✅ ] **Community Posts Loading**: Verify community page loads efficiently
- [✅ ] **Feedback Dashboard**: Test admin dashboard performance
- [✅ ] **Search/Filter Operations**: Test any search functionality

**Expected Behavior:**
- Pages load within reasonable time (< 3 seconds)
- No "index required" errors in console
- Smooth scrolling and interactions

## 🛠️ **Troubleshooting Common Issues**

### **If You See Permission Errors:**

1. **Check Browser Console** for specific error messages
2. **Verify User Authentication** - ensure you're properly logged in
3. **Check User Document** in Firebase Console - ensure required fields exist
4. **Clear Browser Cache** and try again
5. **Check Firebase Console** - Rules tab for any syntax errors

### **If Queries Are Slow:**

1. **Check Firebase Console** - Indexes tab
2. **Look for "index required" errors** in browser console
3. **Verify indexes are built** (may take a few minutes after deployment)

### **If Features Don't Work:**

1. **Check Network Tab** in DevTools for failed requests
2. **Verify API endpoints** are responding
3. **Check backend logs** for any errors
4. **Ensure environment variables** are properly set

## 📝 **Testing Log Template**

Use this template to track your testing:

```
Date: 6/22/2025
Tester: Rocco

✅ PASSED / ❌ FAILED / ⚠️ ISSUES

Authentication:
- Registration: ___
- Login: ___
- Profile Updates: ___

Repairs:
- Create Repair: ___
- View History: ___
- Delete Repair: ___

Community:
- View Posts: ___
- Create Post: ___
- Interactions: ___

Feedback:
- Submit Feedback: ___
- View Feedback: ___

Admin (if applicable):
- Access Dashboard: ___
- Manage Feedback: ___

Security:
- Unauthorized Access Blocked: ___
- Data Validation Working: ___

Performance:
- Page Load Times: ___
- No Index Errors: ___

Issues Found:
1. _______________
2. _______________
3. _______________
```

## 🆘 **If Something Breaks**

### **Emergency Rollback**
If critical functionality is broken:

```bash
# Revert to previous rules (if needed)
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### **Quick Fixes**
- **Permission Denied**: Check if user has required fields in Firestore
- **Index Errors**: Add missing indexes to firestore.indexes.json
- **Validation Errors**: Adjust validation rules in firestore.rules

---

**🎯 Goal**: Ensure all existing functionality works while new security measures are active.

**⏱️ Estimated Testing Time**: 30-45 minutes for comprehensive testing. 