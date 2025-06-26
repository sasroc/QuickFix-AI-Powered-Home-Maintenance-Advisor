import { Request, Response } from 'express';
import Stripe from 'stripe';
import admin from '../utils/firebaseAdmin';
import cacheService from '../services/cacheService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { uid, plan, billing } = req.body;
    if (!uid || !plan || !billing) {
      return res.status(400).json({ message: 'Missing uid, plan, or billing' });
    }

    // Lookup table for price IDs
    const priceIdMap: Record<string, string> = {
      'starter_monthly': process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
      'starter_annual': process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
      'pro_monthly': process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
      'pro_annual': process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
      'premium_monthly': process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
      'premium_annual': process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!,
    };

    const priceKey = `${plan}_${billing}`;
    const priceId = priceIdMap[priceKey];

    if (!priceId) {
      return res.status(400).json({ message: 'Invalid plan or billing interval' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        uid,
        plan,
        billing,
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid || '';
      const status = 'active';
      const subscriptionId = (session.subscription as string) || '';
      const plan = session.metadata?.plan || '';
      const billing = session.metadata?.billing || 'monthly';
      const stripeCustomerId = (session.customer as string) || '';
      // Set initial credits based on plan
      let credits = 0;
      if (plan === 'starter') credits = 25;
      else if (plan === 'pro') credits = 100;
      else if (plan === 'premium') credits = 500;
      if (uid) {
        await admin.firestore().collection('users').doc(uid).set(
          {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
            plan,
            billingInterval: billing,
            credits,
            stripeCustomerId,
          },
          { merge: true }
        );

        // Invalidate user cache since plan and credits changed
        cacheService.invalidateUserData(uid);
        // Fetch user email and name from Firestore
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        const userData = userDoc.data();
        if (userData && userData.email) {
          const name = userData.displayName || userData.email.split('@')[0];
          const EmailService = (await import('../services/email.service')).default;
          await EmailService.getInstance().sendSubscriptionConfirmation(userData.email, name, plan);
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = (subscription.customer as string) || '';
      const status = subscription.status;
      const subscriptionId = subscription.id;
      
      // Find the user by stripeCustomerId
      const usersRef = admin.firestore().collection('users');
      const querySnap = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).get();
      
      if (!querySnap.empty) {
        const userDoc = querySnap.docs[0];
        const userData = userDoc.data();
        
        // Update user subscription status
        await userDoc.ref.set(
          {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
          },
          { merge: true }
        );

        // Invalidate user cache since subscription status changed
        cacheService.invalidateUserData(userDoc.id);

        // Check if subscription was canceled and send cancellation email
        // Check for both immediate cancellation and end-of-period cancellation
        const isCanceled = status === 'canceled' || (subscription as any).cancel_at_period_end === true;
        
        if (isCanceled && userData && userData.email) {
          try {
            const name = userData.displayName || userData.email.split('@')[0];
            const plan = userData.plan || 'starter';
            const billingInterval = userData.billingInterval || 'monthly';
            
            // Calculate access until date (end of current period)
            // Try to get current_period_end from subscription items first, then fallback to cancel_at
            const subscriptionItems = (subscription as any).items?.data;
            const currentPeriodEnd = subscriptionItems && subscriptionItems.length > 0 ? 
              subscriptionItems[0].current_period_end : 
              (subscription as any).current_period_end || (subscription as any).cancel_at;
            
            let accessUntilDate = 'End of current billing period';
            if (currentPeriodEnd) {
              try {
                // Handle both Unix timestamp (seconds) and milliseconds
                const timestamp = typeof currentPeriodEnd === 'number' ? 
                  (currentPeriodEnd > 1000000000000 ? currentPeriodEnd : currentPeriodEnd * 1000) : 
                  new Date(currentPeriodEnd).getTime();
                
                accessUntilDate = new Date(timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              } catch (dateError) {
                console.error('Error parsing subscription end date:', dateError);
              }
            }

            const EmailService = (await import('../services/email.service')).default;
            await EmailService.getInstance().sendSubscriptionCancellation(
              userData.email,
              name,
              plan,
              accessUntilDate,
              billingInterval
            );

            console.log(`Cancellation email sent to ${userData.email} for subscription ${subscriptionId}`);
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
            // Don't fail the webhook if email fails
          }
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = (subscription.customer as string) || '';
      const status = subscription.status;
      const subscriptionId = subscription.id;
      
      // Find the user by stripeCustomerId
      const usersRef = admin.firestore().collection('users');
      const querySnap = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).get();
      
      if (!querySnap.empty) {
        const userDoc = querySnap.docs[0];
        const userData = userDoc.data();
        
        // Update user subscription status
        await userDoc.ref.set(
          {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
          },
          { merge: true }
        );

        // Invalidate user cache since subscription status changed
        cacheService.invalidateUserData(userDoc.id);

        // Send cancellation email if user has email
        if (userData && userData.email) {
          try {
            const name = userData.displayName || userData.email.split('@')[0];
            const plan = userData.plan || 'starter';
            const billingInterval = userData.billingInterval || 'monthly';
            
            // Calculate access until date (end of current period)
            const subscriptionItems = (subscription as any).items?.data;
            const currentPeriodEnd = subscriptionItems && subscriptionItems.length > 0 ? 
              subscriptionItems[0].current_period_end : 
              (subscription as any).current_period_end || (subscription as any).cancel_at;
            
            let accessUntilDate = 'End of current billing period';
            if (currentPeriodEnd) {
              try {
                // Handle both Unix timestamp (seconds) and milliseconds
                const timestamp = typeof currentPeriodEnd === 'number' ? 
                  (currentPeriodEnd > 1000000000000 ? currentPeriodEnd : currentPeriodEnd * 1000) : 
                  new Date(currentPeriodEnd).getTime();
                
                accessUntilDate = new Date(timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              } catch (dateError) {
                console.error('Error parsing subscription end date:', dateError);
              }
            }

            const EmailService = (await import('../services/email.service')).default;
            await EmailService.getInstance().sendSubscriptionCancellation(
              userData.email,
              name,
              plan,
              accessUntilDate,
              billingInterval
            );

            console.log(`Cancellation email sent to ${userData.email} for subscription ${subscriptionId}`);
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
            // Don't fail the webhook if email fails
          }
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    res.status(500).send('Webhook handler failed');
  }
};

export const createPortalSession = async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: 'Missing uid' });
    }

    // Get user data to find customer ID
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.stripeCustomerId) {
      return res.status(404).json({ message: 'No subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const processRefund = async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: 'Missing uid' });
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.stripeCustomerId || !userData.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    // Check refund eligibility
    const eligibility = await checkRefundEligibility(uid, userData);
    if (!eligibility.eligible) {
      return res.status(400).json({ 
        message: eligibility.reason,
        details: eligibility
      });
    }

    // Get the subscription to find the latest invoice
    const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
    
    if (!subscription.latest_invoice) {
      return res.status(400).json({ message: 'No invoice found for this subscription' });
    }

    // Get the invoice to find the payment intent
    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string, {
      expand: ['payment_intent', 'charge']
    });
    
    // Type assertion to access payment_intent (exists in runtime but may not be typed)
    const invoiceAny = invoice as any;
    let paymentIntentId = null;
    
    // Try multiple ways to find the payment intent or charge
    if (typeof invoiceAny.payment_intent === 'string') {
      paymentIntentId = invoiceAny.payment_intent;
    } else if (invoiceAny.payment_intent?.id) {
      paymentIntentId = invoiceAny.payment_intent.id;
        } else if (invoiceAny.charge) {
      // If there's a charge instead of payment_intent, get the payment_intent from the charge
      const chargeId = typeof invoiceAny.charge === 'string' ? invoiceAny.charge : invoiceAny.charge.id;
      const charge = await stripe.charges.retrieve(chargeId);
      paymentIntentId = charge.payment_intent;
    } else {
      // Last resort: try to find recent payment intents for this customer
      const paymentIntents = await stripe.paymentIntents.list({
        customer: userData.stripeCustomerId,
        limit: 10
      });
      
      // Find the most recent successful payment intent with matching amount
      const matchingPaymentIntent = paymentIntents.data.find(pi => 
        pi.status === 'succeeded' && 
        pi.amount === (invoice as any).amount_paid &&
        pi.created >= subscription.created
      );
      
      if (matchingPaymentIntent) {
        paymentIntentId = matchingPaymentIntent.id;
      } else {
        // If no payment intent found, try to find charges directly
        const charges = await stripe.charges.list({
          customer: userData.stripeCustomerId,
          limit: 10
        });
        
        // Find a charge that matches the invoice amount and is paid
        const matchingCharge = charges.data.find(charge => 
          charge.paid && 
          charge.amount === (invoice as any).amount_paid &&
          charge.created >= subscription.created
        );
        
        if (matchingCharge && matchingCharge.payment_intent) {
          paymentIntentId = matchingCharge.payment_intent;
        }
      }
    }
    
    if (!paymentIntentId) {
      return res.status(400).json({ 
        message: 'No payment found for this subscription'
      });
    }

    // Process the refund
    let refund;
    try {
      // Try to refund via payment_intent first
      refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          uid,
          reason: 'no_credits_used_within_24h'
        }
      });
    } catch (paymentIntentError: any) {
      
      // If payment_intent refund fails, try to refund via charge
      const invoiceAny = invoice as any;
      if (invoiceAny.charge) {
        const chargeId = typeof invoiceAny.charge === 'string' ? invoiceAny.charge : invoiceAny.charge.id;
        refund = await stripe.refunds.create({
          charge: chargeId,
          reason: 'requested_by_customer',
          metadata: {
            uid,
            reason: 'no_credits_used_within_24h'
          }
        });
      } else {
        throw new Error('Unable to process refund: no valid payment method found');
      }
    }

    // Cancel the subscription
    await stripe.subscriptions.cancel(userData.stripeSubscriptionId);

    // Update user data in Firestore - reset to free tier
    await admin.firestore().collection('users').doc(uid).update({
      subscriptionStatus: 'canceled',
      refundProcessed: true,
      refundDate: admin.firestore.FieldValue.serverTimestamp(),
      refundAmount: refund.amount,
      stripeRefundId: refund.id,
      credits: 0,
      plan: admin.firestore.FieldValue.delete() // Remove plan field entirely
    });

    // Invalidate user cache
    cacheService.invalidateUserData(uid);

    // Send refund confirmation email
    if (userData.email) {
      try {
        const name = userData.displayName || userData.email.split('@')[0];
        const EmailService = (await import('../services/email.service')).default;
        await EmailService.getInstance().sendRefundConfirmation(
          userData.email,
          name,
          refund.amount / 100, // Convert cents to dollars
          userData.plan || 'starter'
        );
      } catch (emailError) {
        console.error('Failed to send refund confirmation email:', emailError);
      }
    }

    return res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    return res.status(500).json({ message: 'Failed to process refund' });
  }
};

export const getRefundEligibility = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ message: 'Missing uid' });
    }

    // Get user data
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    if (!userData || !userData.stripeSubscriptionId) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const eligibility = await checkRefundEligibility(uid, userData);
    return res.json(eligibility);

  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return res.status(500).json({ message: 'Failed to check refund eligibility' });
  }
};

const checkRefundEligibility = async (uid: string, userData: any) => {
  try {
    // Check if user has already processed a refund
    if (userData.refundProcessed) {
      return {
        eligible: false,
        reason: 'Refund has already been processed for this subscription'
      };
    }

    // Check if subscription is active
    if (userData.subscriptionStatus !== 'active') {
      return {
        eligible: false,
        reason: 'Subscription is not active'
      };
    }

    // Get subscription creation time from Stripe
    const subscription = await stripe.subscriptions.retrieve(userData.stripeSubscriptionId);
    const subscriptionCreated = new Date(subscription.created * 1000);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - subscriptionCreated.getTime()) / (1000 * 60 * 60);

    // Check if within 24 hours
    if (hoursSinceCreation > 24) {
      return {
        eligible: false,
        reason: 'Refund period has expired (more than 24 hours since subscription)',
        hoursSinceCreation: Math.round(hoursSinceCreation * 10) / 10
      };
    }

    // Get initial credits based on plan
    let initialCredits = 0;
    if (userData.plan === 'starter') initialCredits = 25;
    else if (userData.plan === 'pro') initialCredits = 100;
    else if (userData.plan === 'premium') initialCredits = 500;

    // Check if credits have been used
    const currentCredits = userData.credits || 0;
    const creditsUsed = initialCredits - currentCredits;

    if (creditsUsed > 0) {
      return {
        eligible: false,
        reason: 'Credits have been used',
        creditsUsed,
        remainingCredits: currentCredits
      };
    }

    // User is eligible for refund
    return {
      eligible: true,
      reason: 'Eligible for refund',
      hoursSinceCreation: Math.round(hoursSinceCreation * 10) / 10,
      remainingHours: Math.round((24 - hoursSinceCreation) * 10) / 10,
      creditsUsed: 0,
      remainingCredits: currentCredits
    };

  } catch (error) {
    console.error('Error checking refund eligibility:', error);
    return {
      eligible: false,
      reason: 'Error checking eligibility'
    };
  }
}; 