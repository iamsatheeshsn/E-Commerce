import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { handleCheckoutCompleted } from "./orderHandler";

admin.initializeApp();

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret_key || ""
);

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const signature = req.headers["stripe-signature"] as string;
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    functions.config().stripe?.webhook_secret;

  if (!signature || !webhookSecret) {
    res.status(400).send("Missing signature or webhook secret");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook verification failed:", err);
    res.status(400).send("Webhook Error");
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutCompleted(session);
    } catch (error) {
      console.error("Order creation failed:", error);
      res.status(500).send("Order creation failed");
      return;
    }
  }

  res.json({ received: true });
});
