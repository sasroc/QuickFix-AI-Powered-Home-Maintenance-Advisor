import { Request, Response } from 'express';
import Stripe from 'stripe';
import admin from '../utils/firebaseAdmin';
import cacheService from '../services/cacheService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper function to get credit allocation for a plan
const getPlanCredits = (plan: string): number => {
  const planCredits: { [key: string]: number } = {
    'none': 0,
    'starter': 25,
    'pro': 100,
    'premium': 500
  };
  return planCredits[plan] || 25; // Default to starter credits
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  let sessionConfig: any; // Declare sessionConfig here to make it available in the catch block

  try {
    const { uid, plan, billing, isTrial = false } = req.body;
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

    // For free trials, we only offer Starter plan and force monthly billing
    if (isTrial && plan !== 'starter') {
      return res.status(400).json({ message: 'Free trial is only available for Starter plan' });
    }

    // Check if user has already used their trial
    if (isTrial) {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.wasOnTrial) {
          return res.status(400).json({ 
            message: 'You have already used your free trial. Please choose a regular subscription plan.' 
          });
        }
        // Also prevent trial if user already has an active subscription
        if (userData?.subscriptionStatus === 'active') {
          return res.status(400).json({ 
            message: 'You already have an active subscription. Please manage your current subscription instead.' 
          });
        }
      }
    }

    // Force monthly billing for trials
    const effectiveBilling = isTrial ? 'monthly' : billing;
    const priceKey = `${plan}_${effectiveBilling}`;
    const priceId = priceIdMap[priceKey];

    if (!priceId) {
      return res.status(400).json({ message: 'Invalid plan or billing interval' });
    }

    sessionConfig = {
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}${isTrial ? '&trial=true' : ''}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
      metadata: {
        uid,
        plan,
        billing: effectiveBilling,
        isTrial: isTrial.toString(),
      },
    };

    // Apply limited-time discount if available, otherwise allow promotion codes
    const promotionCodeId = process.env.STRIPE_DISCOUNT_COUPON_ID; // This ID should start with 'promo_'
    if (promotionCodeId) {
      sessionConfig.discounts = [{ promotion_code: promotionCodeId }];
    } else {
      sessionConfig.allow_promotion_codes = true;
    }

    // Add trial configuration if this is a trial
    if (isTrial) {
      sessionConfig.subscription_data = {
        trial_period_days: parseInt(process.env.TRIAL_PERIOD_DAYS || '5'), // Default 5 days, configurable via env
        metadata: {
          uid,
          plan,
          billing: effectiveBilling,
          isTrial: 'true',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
      const subscriptionId = (session.subscription as string) || '';
      const plan = session.metadata?.plan || '';
      const billing = session.metadata?.billing || 'monthly';
      const stripeCustomerId = (session.customer as string) || '';
      const isTrial = session.metadata?.isTrial === 'true';
      
      // Set initial credits based on plan
      let credits = 0;
      if (plan === 'starter') credits = 25;
      else if (plan === 'pro') credits = 100;
      else if (plan === 'premium') credits = 500;

      if (uid) {
        const userUpdateData: any = {
          subscriptionStatus: 'active',
          stripeSubscriptionId: subscriptionId,
          plan,
          billingInterval: billing,
          credits,
          stripeCustomerId,
        };

        // Add trial-specific data
        if (isTrial) {
          const trialPeriodDays = parseInt(process.env.TRIAL_PERIOD_DAYS || '5');
          const trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + trialPeriodDays);
          
          userUpdateData.isOnTrial = true;
          userUpdateData.wasOnTrial = true; // Mark that this user has used their trial
          userUpdateData.trialEndDate = admin.firestore.Timestamp.fromDate(trialEndDate);
          userUpdateData.trialStartDate = admin.firestore.Timestamp.now();
        } else {
          userUpdateData.isOnTrial = false;
        }

        await admin.firestore().collection('users').doc(uid).set(userUpdateData, { merge: true });

        // Invalidate user cache since plan and credits changed
        cacheService.invalidateUserData(uid);
        
        // Fetch user email and name from Firestore
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        const userData = userDoc.data();
        if (userData && userData.email) {
          const name = userData.displayName || userData.email.split('@')[0];
          const EmailService = (await import('../services/email.service')).default;
          
          if (isTrial) {
            await EmailService.getInstance().sendTrialConfirmation(userData.email, name, plan);
          } else {
            await EmailService.getInstance().sendSubscriptionConfirmation(userData.email, name, plan);
          }
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
        
        // Check if subscription was canceled and send cancellation email
        // Check for both immediate cancellation and end-of-period cancellation
        const isCanceled = status === 'canceled' || (subscription as any).cancel_at_period_end === true;
        
        // Check if this is a trial cancellation
        const isTrialCancellation = isCanceled && userData.isOnTrial;
        
        const updateData: any = {
          stripeSubscriptionId: subscriptionId,
        };

        // If this is a trial cancellation, track it specially
        if (isTrialCancellation) {
          updateData.isOnTrial = false; // CRITICAL: Stop showing trial banner immediately
          updateData.trialCancelledAt = admin.firestore.Timestamp.now();
          updateData.wasOnTrial = true; // Track that this user was on trial
          updateData.trialExpiredAt = admin.firestore.Timestamp.now(); // Mark when trial ended
          updateData.plan = 'none'; // CRITICAL: Revoke plan access
          updateData.subscriptionStatus = 'inactive'; // CRITICAL: Always set to inactive for trial cancellations
          updateData.credits = 0; // Reset credits to 0
        } else {
          // For regular paid subscribers, just update the status
          // They keep their plan and credits until the billing period ends
          updateData.subscriptionStatus = status;
        }

        // Update user subscription status
        await userDoc.ref.set(updateData, { merge: true });

        // Invalidate user cache since subscription status changed
        cacheService.invalidateUserData(userDoc.id);

        // Log cancellation for debugging
        if (isTrialCancellation) {
          console.log(`TRIAL CANCELLED (via subscription.updated): User ${userDoc.id} - Firestore updated with plan: 'none', subscriptionStatus: 'inactive', credits: 0. Original Stripe status was: '${status}', Cancel at period end: ${(subscription as any).cancel_at_period_end}`);
        } else if (isCanceled) {
          console.log(`PAID SUBSCRIPTION CANCELLED (via subscription.updated): User ${userDoc.id} - Keeps plan and credits until billing period ends. Firestore updated with subscriptionStatus: '${status}'`);
        }
        
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
    } else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = ((invoice as any).subscription as string) || '';
      
      // Extract subscription ID from invoice lines if not available directly
      const invoiceLines = (invoice as any).lines?.data || [];
      let subscriptionIdFromLine = '';
      
      if (invoiceLines.length > 0) {
        const line = invoiceLines[0];
        // Check direct subscription property
        if (line?.subscription) {
          subscriptionIdFromLine = line.subscription;
        }
        // Check nested in parent.subscription_item_details.subscription
        else if (line?.parent?.subscription_item_details?.subscription) {
          subscriptionIdFromLine = line.parent.subscription_item_details.subscription;
        }
      }
      
      const finalSubscriptionId = subscriptionId || subscriptionIdFromLine || '';
      
      if (finalSubscriptionId) {
        // Find the user by subscription ID
        const usersRef = admin.firestore().collection('users');
        const querySnap = await usersRef.where('stripeSubscriptionId', '==', finalSubscriptionId).get();
        
        if (!querySnap.empty) {
          const userDoc = querySnap.docs[0];
          const userData = userDoc.data();
          
          // Check if this is the first payment after trial (trial ending) and amount > 0
          if (userData.isOnTrial && invoice.amount_paid > 0) {
            // Get credit allocation for user's plan
            const userPlan = userData.plan || 'starter';
            const creditsToReset = getPlanCredits(userPlan);
            
            const updateData: any = {
              isOnTrial: false,
              trialExpiredAt: admin.firestore.Timestamp.now(),
              subscriptionStatus: 'active',
              credits: creditsToReset, // Reset credits to plan allocation
            };

            await userDoc.ref.set(updateData, { merge: true });
            
            // Invalidate user cache since trial status changed
            cacheService.invalidateUserData(userDoc.id);
            
            console.log(`Trial ended and payment succeeded for user ${userDoc.id}, subscription ${finalSubscriptionId}. Credits reset to ${creditsToReset} for ${userPlan} plan.`);
            
            // Send trial conversion email
            if (userData.email) {
              try {
                const name = userData.displayName || userData.email.split('@')[0];
                const plan = userData.plan || 'starter';
                const EmailService = (await import('../services/email.service')).default;
                await EmailService.getInstance().sendTrialConversionConfirmation(
                  userData.email,
                  name,
                  plan
                );
              } catch (emailError) {
                console.error('Failed to send trial conversion email:', emailError);
              }
            }
          }
        }
              } else {
          // Fallback: try to find user by customer ID
          const customerId = (invoice.customer as string) || '';
          if (customerId && invoice.amount_paid > 0) {
            const usersRef = admin.firestore().collection('users');
            const customerQuerySnap = await usersRef.where('stripeCustomerId', '==', customerId).get();
            
            if (!customerQuerySnap.empty) {
              const userDoc = customerQuerySnap.docs[0];
              const userData = userDoc.data();
              
              if (userData.isOnTrial) {
                // Get credit allocation for user's plan
                const userPlan = userData.plan || 'starter';
                const creditsToReset = getPlanCredits(userPlan);
                
                const updateData: any = {
                  isOnTrial: false,
                  trialExpiredAt: admin.firestore.Timestamp.now(),
                  subscriptionStatus: 'active',
                  credits: creditsToReset, // Reset credits to plan allocation
                };

                await userDoc.ref.set(updateData, { merge: true });
                
                // Invalidate user cache since trial status changed
                cacheService.invalidateUserData(userDoc.id);
                
                console.log(`Trial ended and payment succeeded for user ${userDoc.id} via customer ID ${customerId}. Credits reset to ${creditsToReset} for ${userPlan} plan.`);
                
                // Send trial conversion email
                if (userData.email) {
                  try {
                    const name = userData.displayName || userData.email.split('@')[0];
                    const plan = userData.plan || 'starter';
                    const EmailService = (await import('../services/email.service')).default;
                    await EmailService.getInstance().sendTrialConversionConfirmation(
                      userData.email,
                      name,
                      plan
                    );
                  } catch (emailError) {
                    console.error('Failed to send trial conversion email:', emailError);
                  }
                }
              }
            }
          }
        }
      } else if ((event as any).type === 'customer.subscription.updated') {
        const subscription = (event as any).data.object as Stripe.Subscription;
        const stripeCustomerId = (subscription.customer as string) || '';
        const status = subscription.status;
        const subscriptionId = subscription.id;
        
        // Check if this is a trial ending (trial_end is in the past and status is active)
        const now = Math.floor(Date.now() / 1000);
        const trialEnded = subscription.trial_end && subscription.trial_end < now;
        
        if (trialEnded && status === 'active') {
          // Find the user by customer ID
          const usersRef = admin.firestore().collection('users');
          const querySnap = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).get();
          
          if (!querySnap.empty) {
            const userDoc = querySnap.docs[0];
            const userData = userDoc.data();
            
            if (userData.isOnTrial) {
              // Get credit allocation for user's plan
              const userPlan = userData.plan || 'starter';
              const creditsToReset = getPlanCredits(userPlan);
              
              const updateData: any = {
                isOnTrial: false,
                trialExpiredAt: admin.firestore.Timestamp.now(),
                subscriptionStatus: 'active',
                credits: creditsToReset, // Reset credits to plan allocation
              };

              await userDoc.ref.set(updateData, { merge: true });
              
              // Invalidate user cache since trial status changed
              cacheService.invalidateUserData(userDoc.id);
              
              console.log(`Trial ended via subscription.updated for user ${userDoc.id}, subscription ${subscriptionId}. Credits reset to ${creditsToReset} for ${userPlan} plan.`);
              
              // Send trial conversion email
              if (userData.email) {
                try {
                  const name = userData.displayName || userData.email.split('@')[0];
                  const plan = userData.plan || 'starter';
                  const EmailService = (await import('../services/email.service')).default;
                  await EmailService.getInstance().sendTrialConversionConfirmation(
                    userData.email,
                    name,
                    plan
                  );
                } catch (emailError) {
                  console.error('Failed to send trial conversion email:', emailError);
                }
              }
            }
          }
        }
      } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = (event as any).data.object as Stripe.PaymentIntent;
      const customerId = (paymentIntent.customer as string) || '';
      
      console.log(`Payment failed for customer ${customerId}. Payment intent: ${paymentIntent.id}, status: ${paymentIntent.status}, last_payment_error: ${JSON.stringify(paymentIntent.last_payment_error)}`);
      
      // Find user by customer ID
      if (customerId) {
        const usersRef = admin.firestore().collection('users');
        const querySnap = await usersRef.where('stripeCustomerId', '==', customerId).get();
        
        if (!querySnap.empty) {
          const userDoc = querySnap.docs[0];
          const userData = userDoc.data();
          
          // Log the payment failure for debugging
          console.log(`Payment failed for user ${userDoc.id}. Payment intent: ${paymentIntent.id}, failure reason: ${paymentIntent.last_payment_error?.message || 'Unknown'}`);
          
          // Optionally, you could send an email to the user about the failed payment
          if (userData && userData.email) {
            try {
              const name = userData.displayName || userData.email.split('@')[0];
              const EmailService = (await import('../services/email.service')).default;
              await EmailService.getInstance().sendPaymentFailedEmail(
                userData.email,
                name,
                paymentIntent.last_payment_error?.message || 'Payment authentication incomplete'
              );
            } catch (emailError) {
              console.error('Failed to send payment failed email:', emailError);
            }
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
        
        // Check if this is a trial cancellation  
        const isTrialCancellation = userData.isOnTrial;
        
        const updateData: any = {
          stripeSubscriptionId: subscriptionId,
        };

        // If this is a trial cancellation, track it specially
        if (isTrialCancellation) {
          updateData.isOnTrial = false; // CRITICAL: Stop showing trial banner
          updateData.trialCancelledAt = admin.firestore.Timestamp.now();
          updateData.wasOnTrial = true; // Track that this user was on trial
          updateData.trialExpiredAt = admin.firestore.Timestamp.now(); // Mark when trial ended
          updateData.plan = 'none'; // CRITICAL: Revoke plan access
          updateData.subscriptionStatus = 'inactive'; // CRITICAL: Always set to inactive for trial cancellations
          updateData.credits = 0; // Reset credits to 0
        } else {
          // For regular paid subscribers, subscription deleted means billing period ended
          // So we do revoke access when the subscription is actually deleted
          updateData.subscriptionStatus = status; // Use Stripe status (usually 'canceled')
          updateData.plan = 'none'; // Revoke plan access - billing period has ended
          updateData.credits = 0; // Reset credits - billing period has ended
        }

        // Update user subscription status
        await userDoc.ref.set(updateData, { merge: true });

        // Invalidate user cache since subscription status changed
        cacheService.invalidateUserData(userDoc.id);

        // Log cancellation for debugging
        if (isTrialCancellation) {
          console.log(`TRIAL CANCELLED (via subscription.deleted): User ${userDoc.id} - Firestore updated with plan: 'none', subscriptionStatus: 'inactive', credits: 0. Original Stripe status was: '${status}'`);
        } else {
          console.log(`SUBSCRIPTION EXPIRED (via subscription.deleted): User ${userDoc.id} - Billing period ended, access revoked. Firestore updated with plan: 'none', subscriptionStatus: '${status}', credits: 0`);
        }

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