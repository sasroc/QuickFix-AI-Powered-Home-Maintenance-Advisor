# Firebase Security Rules & Indexes Setup Guide

## Overview

This guide covers the setup of Firebase Security Rules and Firestore indexes for the QuickFix application. These configurations are **critical** for production deployment and must be implemented before going live.

## 🔒 Security Rules Implementation

### 1. **Deploy Security Rules**

The `firestore.rules` file contains comprehensive security rules for all collections. Deploy them using the Firebase CLI:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not already done)
firebase init firestore

# Deploy the security rules
firebase deploy --only firestore:rules
```

### 2. **Key Security Features Implemented**

#### **Authentication & Authorization**
- ✅ **User Authentication**: All sensitive operations require authentication
- ✅ **Ownership Validation**: Users can only access their own data
- ✅ **Admin Controls**: Special admin permissions for management functions
- ✅ **Subscription Gating**: Community posts require active subscription

#### **Data Validation**
- ✅ **Input Sanitization**: All data fields are validated for type and size
- ✅ **Business Logic**: Enforces application rules at database level
- ✅ **Schema Validation**: Ensures data structure consistency
- ✅ **Rate Limiting**: Prevents abuse through field size limits

#### **Collection-Specific Security**

**Users Collection (`/users/{userId}`)**
- Users can read/write their own profile data
- Admins can read all user data for dashboard
- Validates subscription status, credits, and plan data
- Prevents privilege escalation (users can't make themselves admin)

**Repairs Collection (`/repairs/{repairId}`)**
- Users can only access their own repair history
- Validates repair data structure and limits
- Prevents data tampering and unauthorized access
- Supports repair history management

**Community Posts Collection (`/community_posts/{postId}`)**
- Public read access for community features
- Only subscribed users can create posts
- Users can manage their own posts
- Admins can moderate any content
- Validates post data and prevents spam

**Feedback Collection (`/feedback/{feedbackId}`)**
- Users can read their own feedback
- Anonymous feedback submission allowed
- Admins have full management access
- Validates feedback structure and prevents abuse

### 3. **Testing Security Rules**

Before deploying to production, test your security rules:

```bash
# Install Firebase emulator
firebase init emulators

# Start the emulator with your rules
firebase emulators:start --only firestore

# Run your tests against the emulator
npm test
```

## 📊 Firestore Indexes Setup

### 1. **Deploy Indexes**

The `firestore.indexes.json` file contains optimized indexes for all queries. Deploy them:

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

### 2. **Key Indexes Implemented**

#### **Performance-Critical Indexes**
- **Repair History**: `userId + timestamp (desc)` - For user repair history queries
- **Community Posts**: Multiple indexes for filtering and sorting
- **Feedback Management**: Indexes for admin dashboard filtering
- **User Management**: Indexes for subscription and admin queries

#### **Array Field Indexes**
- **Community Tags**: For tag-based filtering
- **Liked Posts**: For user interaction tracking
- **Feedback Screenshots**: For attachment management

### 3. **Index Monitoring**

After deployment, monitor index usage in Firebase Console:
1. Go to Firebase Console → Firestore → Indexes
2. Check index build status
3. Monitor query performance
4. Add additional indexes if needed

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] **Review Rules**: Ensure all security rules match your application logic
- [ ] **Test Thoroughly**: Test all user flows with the new rules
- [ ] **Backup Data**: Create a backup of your Firestore data
- [ ] **Admin Setup**: Ensure at least one admin user exists

### **Deployment Steps**
1. **Deploy Rules First**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Wait for Index Build**: Large indexes may take time to build

4. **Test Production**: Verify all functionality works with new rules

### **Post-Deployment**
- [ ] **Monitor Errors**: Check Firebase Console for rule violations
- [ ] **Performance Check**: Ensure queries are performing well
- [ ] **User Testing**: Have users test key flows
- [ ] **Error Logging**: Monitor application logs for security issues

## 🔧 Troubleshooting

### **Common Issues**

#### **Permission Denied Errors**
```javascript
// Error: Missing or insufficient permissions
// Solution: Check if user is authenticated and has proper access
```

**Debug Steps**:
1. Check Firebase Console → Authentication → Users
2. Verify user has required fields (isAdmin, subscriptionStatus, etc.)
3. Test rules in Firebase Console → Firestore → Rules playground

#### **Index Missing Errors**
```javascript
// Error: The query requires an index
// Solution: Add the required index to firestore.indexes.json
```

**Debug Steps**:
1. Copy the suggested index from the error message
2. Add it to `firestore.indexes.json`
3. Deploy: `firebase deploy --only firestore:indexes`

#### **Rule Validation Errors**
```javascript
// Error: Resource failed validation
// Solution: Check data structure matches validation rules
```

**Debug Steps**:
1. Review the validation function in `firestore.rules`
2. Check data being sent matches expected structure
3. Verify required fields are present

### **Testing Tools**

#### **Rules Playground**
Use Firebase Console → Firestore → Rules playground to test specific scenarios:
1. Set authentication context
2. Choose operation (read/write)
3. Set document path
4. Add request data
5. Run simulation

#### **Local Testing**
```bash
# Start emulator
firebase emulators:start --only firestore

# Run tests
npm run test:security
```

## 📋 Security Best Practices

### **Implemented Best Practices**
- ✅ **Principle of Least Privilege**: Users only access what they need
- ✅ **Defense in Depth**: Multiple validation layers
- ✅ **Input Validation**: All inputs are sanitized and validated
- ✅ **Audit Trail**: Admin actions are logged
- ✅ **Rate Limiting**: Field size limits prevent abuse

### **Ongoing Security**
- **Regular Reviews**: Review rules quarterly
- **Monitor Logs**: Check for suspicious activity
- **Update Rules**: Keep rules updated with app changes
- **Security Audits**: Periodic security assessments

## 🆘 Emergency Procedures

### **If Security Rules Block Legitimate Users**
1. **Immediate**: Revert to previous rules
   ```bash
   git checkout HEAD~1 firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Investigate**: Check Firebase Console logs
3. **Fix**: Update rules and test
4. **Redeploy**: Deploy fixed rules

### **If Data is Compromised**
1. **Immediate**: Disable affected collections
2. **Assess**: Determine scope of compromise
3. **Restore**: Restore from backup if needed
4. **Strengthen**: Update security rules
5. **Monitor**: Increase monitoring

## 📞 Support

If you encounter issues with security rules:
1. Check Firebase Console error logs
2. Review this documentation
3. Test in Firebase Rules playground
4. Check Firebase documentation
5. Contact support if needed

---

**⚠️ Critical Reminder**: Never deploy to production without proper security rules. The default rules allow full access and are not suitable for production use. 