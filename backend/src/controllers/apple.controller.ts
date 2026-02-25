import { Request, Response } from 'express';
import { SignedDataVerifier, Environment } from '@apple/app-store-server-library';
import admin from '../utils/firebaseAdmin';
import { logger } from '../utils/logger';
import { captureException, addBreadcrumb } from '../utils/sentry';
import cacheService from '../services/cacheService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestWithUser extends Request {
  user?: admin.auth.DecodedIdToken;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Maps Apple product IDs to plan + billing interval.
// Must match the product IDs configured in App Store Connect.
const PRODUCT_PLAN_MAP: Record<string, { plan: string; billing: string }> = {
  'com.quickfixai.starter.monthly': { plan: 'starter', billing: 'monthly' },
  'com.quickfixai.starter.annual':  { plan: 'starter', billing: 'annual'  },
  'com.quickfixai.pro.monthly':     { plan: 'pro',     billing: 'monthly' },
  'com.quickfixai.pro.annual':      { plan: 'pro',     billing: 'annual'  },
  'com.quickfixai.premium.monthly': { plan: 'premium', billing: 'monthly' },
  'com.quickfixai.premium.annual':  { plan: 'premium', billing: 'annual'  },
};

// Must match SubscriptionPlan.credits in the iOS model and stripe.controller.ts
const PLAN_CREDITS: Record<string, number> = {
  none:    0,
  starter: 10,
  pro:     25,
  premium: 100,
};

function getPlanCredits(plan: string): number {
  return PLAN_CREDITS[plan] ?? 0;
}

// ─── SignedDataVerifier (lazy, synchronous, cached) ───────────────────────────
//
// Apple Root CA G3 (DER, base64-encoded). Hardcoded from the library's own test
// suite to avoid flaky runtime CDN fetches that return unusable data.
// Source: @apple/app-store-server-library/dist/tests/unit-tests/jws_verification.test.js
// (REAL_APPLE_ROOT_BASE64_ENCODED)

const APPLE_ROOT_CA_G3_BASE64 =
  'MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwSQXBwbGUgUm9v' +
  'dCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTETMBEGA1UE' +
  'CgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcNMTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2' +
  'WjBnMRswGQYDVQQDDBJBcHBsZSBSb290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmlj' +
  'YXRpb24gQXV0aG9yaXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqG' +
  'SM49AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtfTjjTuxxE' +
  'tX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517IDvYuVTZXpmkOlEKMaNC' +
  'MEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySrMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0P' +
  'AQH/BAQDAgEGMAoGCCqGSM49BAMDA2gAMGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3m' +
  'eoyhpmvOwgPUnPWTxnS4at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkL' +
  'F1vLUagM6BgD56KyKA==';

let _verifier: SignedDataVerifier | null = null;

function getVerifier(): SignedDataVerifier {
  if (_verifier) return _verifier;
  const rootCAs    = [Buffer.from(APPLE_ROOT_CA_G3_BASE64, 'base64')];
  const environment = process.env.APPLE_SANDBOX === 'true'
    ? Environment.SANDBOX
    : Environment.PRODUCTION;
  const appAppleId  = process.env.APPLE_APP_APPLE_ID
    ? parseInt(process.env.APPLE_APP_APPLE_ID, 10)
    : undefined;
  _verifier = new SignedDataVerifier(
    rootCAs,
    true,   // enableOnlineChecks — OCSP revocation
    environment,
    process.env.APPLE_BUNDLE_ID!,
    appAppleId,
  );
  return _verifier;
}

// ─── JWS decode without signature verification ────────────────────────────────
//
// Used when APPLE_BYPASS_VERIFICATION=true (Xcode StoreKit config file testing).
// Xcode-generated JWS is signed with ephemeral test keys, not Apple's real root CA,
// so verifyAndDecodeTransaction always throws in that environment.

function decodeJWSPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ─── Controller: POST /api/apple/verify-purchase ──────────────────────────────
//
// Called by the iOS app immediately after a successful StoreKit 2 transaction.
// The app sends the signed JWS transaction string from Transaction.jwsRepresentation.
// We verify it with Apple, extract plan info, and update Firestore.

export const verifyPurchase = async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ message: 'Unauthorized' });

    const { signedTransactionInfo } = req.body as { signedTransactionInfo: string };

    if (!signedTransactionInfo) {
      return res.status(400).json({ message: 'Missing signedTransactionInfo' });
    }

    addBreadcrumb('Apple IAP verify-purchase started', 'apple', { uid });

    // ── 1. Verify the JWS transaction with Apple ──────────────────────────
    let transaction: Awaited<ReturnType<SignedDataVerifier['verifyAndDecodeTransaction']>>;
    try {
      transaction = await getVerifier().verifyAndDecodeTransaction(signedTransactionInfo);
    } catch (err) {
      // APPLE_BYPASS_VERIFICATION=true skips Apple chain verification.
      // Use ONLY for local testing with an Xcode StoreKit config file — the
      // file signs JWS with ephemeral test keys that don't chain to Apple's CA.
      if (process.env.APPLE_BYPASS_VERIFICATION === 'true') {
        const raw = decodeJWSPayload(signedTransactionInfo);
        if (!raw) {
          logger.error('Apple bypass: failed to decode JWS payload');
          return res.status(400).json({ message: 'Invalid transaction' });
        }
        logger.warn('Apple IAP: BYPASSING signature verification (test mode)');
        transaction = raw as unknown as typeof transaction;
      } else {
        logger.error('Apple transaction verification failed:', err);
        return res.status(400).json({ message: 'Invalid transaction' });
      }
    }

    const {
      productId,
      originalTransactionId,
      transactionId,
      purchaseDate,
      expiresDate,
      offerType,  // 1 = INTRODUCTORY_OFFER (free trial)
    } = transaction;

    logger.info(`Apple IAP: verified transaction ${transactionId} for uid ${uid}`);

    // ── 2. Map productId → plan + billing ────────────────────────────────
    const planInfo = PRODUCT_PLAN_MAP[productId ?? ''];
    if (!planInfo) {
      logger.error(`Apple IAP: unknown productId ${productId}`);
      return res.status(400).json({ message: 'Unknown product' });
    }
    const { plan, billing } = planInfo;

    // ── 3. Check lifetime access (never overwrite it) ─────────────────────
    const userRef  = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    if (userData?.hasLifetimeAccess) {
      logger.info(`Apple IAP: uid ${uid} has lifetime access — skipping update`);
      return res.json({ success: true, skipped: true });
    }

    // ── 4. Determine if this is a trial (introductory offer type 1) ───────
    const isTrial      = offerType === 1;
    const trialEndDate = isTrial && expiresDate ? new Date(expiresDate) : null;
    const credits      = getPlanCredits(plan);

    // ── 5. Build Firestore update ─────────────────────────────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();

    const update: Record<string, unknown> = {
      subscriptionStatus:         isTrial ? 'trialing' : 'active',
      plan,
      billingInterval:            billing,
      credits,
      paymentProvider:            'apple',
      appleOriginalTransactionId: originalTransactionId,
      lastCreditReset:            now,
      isOnTrial:                  isTrial,
      wasOnTrial:                 isTrial ? true : (userData?.wasOnTrial ?? false),
    };

    if (isTrial && trialEndDate) {
      update.trialStartDate = admin.firestore.Timestamp.fromDate(
        new Date(purchaseDate ?? Date.now())
      );
      update.trialEndDate = admin.firestore.Timestamp.fromDate(trialEndDate);
    }

    await userRef.set(update, { merge: true });
    cacheService.invalidateUserData(uid);

    logger.info(`Apple IAP: Firestore updated for uid ${uid} → plan=${plan}, trial=${isTrial}`);

    // ── 6. Send confirmation email ────────────────────────────────────────
    try {
      const email = userData?.email;
      if (email) {
        const EmailService = (await import('../services/email.service')).default;
        const svc = EmailService.getInstance();
        if (isTrial) {
          await svc.sendTrialConfirmation(email, userData?.displayName ?? '', plan);
        } else {
          await svc.sendSubscriptionConfirmation(email, userData?.displayName ?? '', plan);
        }
      }
    } catch (emailErr) {
      // Non-fatal — log but don't fail the request
      logger.error('Apple IAP: email send failed:', emailErr);
    }

    return res.json({ success: true, plan, billing, isTrial });

  } catch (error) {
    logger.error('Apple IAP verify-purchase error:', error);
    captureException(error as Error, { path: req.path, uid: req.user?.uid });
    return res.status(500).json({ message: 'Failed to verify purchase' });
  }
};

// ─── Controller: POST /api/apple/server-notification ─────────────────────────
//
// Apple calls this URL for all subscription lifecycle events.
// The entire payload is a JWS-signed string. We verify and decode it,
// then handle each notification type just like Stripe webhook events.
//
// Notification types reference:
// https://developer.apple.com/documentation/appstoreservernotifications/notificationtype

export const handleServerNotification = async (req: Request, res: Response) => {
  try {
    const { signedPayload } = req.body as { signedPayload: string };

    if (!signedPayload) {
      // Still return 200 — we don't want Apple to retry malformed payloads
      return res.status(200).json({ received: true });
    }

    // ── 1. Verify and decode the notification ─────────────────────────────
    let notification: Awaited<ReturnType<SignedDataVerifier['verifyAndDecodeNotification']>>;
    try {
      notification = await getVerifier().verifyAndDecodeNotification(signedPayload);
    } catch (err) {
      logger.error('Apple server notification verification failed:', err);
      // Return 200 — returning 4xx/5xx causes Apple to retry aggressively
      return res.status(200).json({ received: true });
    }

    const { notificationType, subtype, data } = notification;
    const { signedTransactionInfo } = (data ?? {}) as {
      signedTransactionInfo?: string;
      signedRenewalInfo?: string;
    };

    // ── 2. Decode the embedded transaction (also JWS) ─────────────────────
    let transaction: Awaited<ReturnType<SignedDataVerifier['verifyAndDecodeTransaction']>> | null = null;
    if (signedTransactionInfo) {
      try {
        transaction = await getVerifier().verifyAndDecodeTransaction(signedTransactionInfo);
      } catch {
        logger.error('Apple notification: failed to decode embedded transaction');
        return res.status(200).json({ received: true });
      }
    }

    const originalTransactionId = transaction?.originalTransactionId;
    const productId              = transaction?.productId;
    const expiresDate            = transaction?.expiresDate;

    logger.info(
      `Apple server notification: ${notificationType}/${subtype ?? ''} — txn ${originalTransactionId}`
    );
    addBreadcrumb('Apple server notification', 'apple', {
      notificationType,
      subtype,
      originalTransactionId,
    });

    // ── 3. Look up user by appleOriginalTransactionId ─────────────────────
    // Apple does not include uid in the payload — we link via the transaction ID
    // stored in Firestore during verify-purchase.
    if (!originalTransactionId) {
      logger.warn('Apple notification: no originalTransactionId — cannot find user');
      return res.status(200).json({ received: true });
    }

    const usersRef  = admin.firestore().collection('users');
    const userQuery = await usersRef
      .where('appleOriginalTransactionId', '==', originalTransactionId)
      .limit(1)
      .get();

    if (userQuery.empty) {
      logger.warn(
        `Apple notification: no user found for originalTransactionId ${originalTransactionId}`
      );
      return res.status(200).json({ received: true });
    }

    const userDoc  = userQuery.docs[0];
    const uid      = userDoc.id;
    const userData = userDoc.data();

    // ── 4. Lifetime access guard ──────────────────────────────────────────
    if (userData.hasLifetimeAccess) {
      logger.info(`Apple notification: uid ${uid} has lifetime access — skipping`);
      return res.status(200).json({ received: true });
    }

    // ── 5. Handle each notification type ─────────────────────────────────
    const planInfo = productId ? PRODUCT_PLAN_MAP[productId] : null;
    const now      = admin.firestore.FieldValue.serverTimestamp();
    let update: Record<string, unknown> | null = null;

    switch (notificationType) {

      // New subscription started (also fires on re-subscribe after lapse)
      case 'SUBSCRIBED': {
        if (!planInfo) break;
        const isTrial = subtype === 'INITIAL_BUY' && transaction?.offerType === 1;
        update = {
          subscriptionStatus: isTrial ? 'trialing' : 'active',
          plan:               planInfo.plan,
          billingInterval:    planInfo.billing,
          credits:            getPlanCredits(planInfo.plan),
          isOnTrial:          isTrial,
          wasOnTrial:         isTrial ? true : userData.wasOnTrial,
          lastCreditReset:    now,
        };
        if (isTrial && expiresDate) {
          update.trialEndDate = admin.firestore.Timestamp.fromDate(new Date(expiresDate));
        }
        break;
      }

      // Successful renewal or billing recovery — credits reset here
      case 'DID_RENEW': {
        if (!planInfo) break;
        const wasOnTrial = userData.isOnTrial === true;
        update = {
          subscriptionStatus: 'active',
          plan:               planInfo.plan,
          billingInterval:    planInfo.billing,
          credits:            getPlanCredits(planInfo.plan),
          isOnTrial:          false,
          lastCreditReset:    now,
        };
        if (wasOnTrial) {
          // Trial just converted to paid — send conversion email
          try {
            const email = userData.email;
            if (email) {
              const EmailService = (await import('../services/email.service')).default;
              await EmailService.getInstance().sendTrialConversionConfirmation(
                email,
                userData.displayName ?? '',
                planInfo.plan
              );
            }
          } catch (emailErr) {
            logger.error('Apple notification DID_RENEW: email failed:', emailErr);
          }
        }
        break;
      }

      // User turned off auto-renew. Subscription still active until period end.
      // Do NOT revoke access here — only EXPIRED does that.
      case 'DID_CHANGE_RENEWAL_STATUS': {
        if (subtype === 'AUTO_RENEW_DISABLED') {
          logger.info(`Apple notification: uid ${uid} disabled auto-renew (still active until expiry)`);
        }
        // No Firestore update — access remains until EXPIRED fires
        break;
      }

      // User changed to a different plan — takes effect at next renewal.
      // DID_RENEW will carry the updated plan on the next billing date.
      case 'DID_CHANGE_RENEWAL_PREF': {
        logger.info(`Apple notification: uid ${uid} changed renewal plan (takes effect at renewal)`);
        break;
      }

      // Subscription expired (end of period after cancellation, or hard failure)
      case 'EXPIRED': {
        update = {
          subscriptionStatus: 'canceled',
          plan:               'none',
          credits:            0,
          isOnTrial:          false,
        };
        try {
          const email = userData.email;
          if (email) {
            const accessUntilDate = new Date().toLocaleDateString('en-US', {
              month: 'long',
              day:   'numeric',
              year:  'numeric',
            });
            const EmailService = (await import('../services/email.service')).default;
            await EmailService.getInstance().sendSubscriptionCancellation(
              email,
              userData.displayName ?? '',
              userData.plan ?? 'starter',
              accessUntilDate,
              userData.billingInterval ?? 'monthly'
            );
          }
        } catch (emailErr) {
          logger.error('Apple notification EXPIRED: email failed:', emailErr);
        }
        break;
      }

      // Payment failed; Apple enters a 16-day grace period.
      // Maintain access during grace period — pastDue lets the iOS app show a banner.
      case 'GRACE_PERIOD_EXPIRED': {
        update = {
          subscriptionStatus: 'pastDue',
        };
        break;
      }

      // Apple issued a refund
      case 'REFUND': {
        update = {
          subscriptionStatus: 'canceled',
          plan:               'none',
          credits:            0,
          isOnTrial:          false,
          refundProcessed:    true,
          refundDate:         now,
          paymentProvider:    'apple',
        };
        logger.info(`Apple notification: REFUND processed for uid ${uid}`);
        break;
      }

      // Apple reversed a previously granted refund
      case 'REFUND_REVERSED': {
        if (!planInfo) break;
        update = {
          subscriptionStatus: 'active',
          plan:               planInfo.plan,
          credits:            getPlanCredits(planInfo.plan),
          refundProcessed:    false,
        };
        break;
      }

      default:
        logger.info(`Apple notification: unhandled type ${notificationType} — ignoring`);
    }

    // ── 6. Write to Firestore ─────────────────────────────────────────────
    if (update) {
      await userDoc.ref.set(update, { merge: true });
      cacheService.invalidateUserData(uid);
      logger.info(
        `Apple notification: Firestore updated for uid ${uid} (${notificationType})`
      );
    }

    // Always return 200 — Apple retries on non-2xx for up to 24 hours
    return res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Apple server notification error:', error);
    captureException(error as Error, { path: req.path });
    // Still return 200 so Apple doesn't retry indefinitely on unexpected errors
    return res.status(200).json({ received: true });
  }
};
