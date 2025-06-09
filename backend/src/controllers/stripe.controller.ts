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
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      let uid = '';
      let status = '';
      let subscriptionId = '';
      let plan = '';

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        uid = session.metadata?.uid || '';
        status = 'active';
        subscriptionId = (session.subscription as string) || '';
        plan = session.metadata?.plan || '';
      } else {
        const subscription = event.data.object as Stripe.Subscription;
        status = subscription.status;
        subscriptionId = subscription.id;
        // plan = subscription.items.data[0]?.plan.id;
      }

      if (uid) {
        await admin.firestore().collection('users').doc(uid).set(
          {
            subscriptionStatus: status,
            stripeSubscriptionId: subscriptionId,
            plan,
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