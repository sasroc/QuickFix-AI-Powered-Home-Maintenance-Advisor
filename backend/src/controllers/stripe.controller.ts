import { Request, Response } from 'express';
import Stripe from 'stripe';
import admin from '../utils/firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { uid, plan } = req.body;
    if (!uid || !plan) {
      return res.status(400).json({ message: 'Missing uid or plan' });
    }

    // Choose the correct price ID
    let priceId = '';
    if (plan === 'monthly') {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID!;
    } else if (plan === 'annual') {
      priceId = process.env.STRIPE_ANNUAL_PRICE_ID!;
    } else {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    // Create Stripe Checkout session
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
      const stripeCustomerId = (session.customer as string) || '';
      if (uid) {
        await admin.firestore().collection('users').doc(uid).set(
          {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
            plan,
            stripeCustomerId,
          },
          { merge: true }
        );
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = (subscription.customer as string) || '';
      const status = subscription.status;
      const subscriptionId = subscription.id;
      // Find the user by stripeCustomerId
      const usersRef = admin.firestore().collection('users');
      const querySnap = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).get();
      if (!querySnap.empty) {
        const userDoc = querySnap.docs[0];
        await userDoc.ref.set(
          {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
          },
          { merge: true }
        );
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
    // Get the user's Stripe customer ID from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer ID found for user' });
    }
    // Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: process.env.FRONTEND_URL || 'http://localhost:3000/account',
    });
    return res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 