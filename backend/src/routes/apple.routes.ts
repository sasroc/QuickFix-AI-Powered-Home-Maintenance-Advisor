import { Router } from 'express';
import { verifyPurchase, handleServerNotification } from '../controllers/apple.controller';
import { generalRateLimit, webhookRateLimit } from '../middleware/rateLimiter';
import decodeToken from '../middleware/decodeToken';

const router = Router();

// Called by the iOS app immediately after a successful StoreKit 2 transaction.
// Requires Firebase auth — user must be signed in.
router.post('/verify-purchase', generalRateLimit, decodeToken, verifyPurchase);

// Called by Apple servers for subscription lifecycle events.
// No auth middleware — Apple signs the JWS payload itself; we verify via SignedDataVerifier.
router.post('/server-notification', webhookRateLimit, handleServerNotification);

export default router;
