import * as admin from "firebase-admin";
import Stripe from "stripe";

const SHIPPING_FEE = 49;
const TAX_RATE = 0.18;

interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
) {
  const db = admin.firestore();
  const stripeSessionId = session.id;

  const existing = await db
    .collection("orders")
    .where("stripeSessionId", "==", stripeSessionId)
    .limit(1)
    .get();

  if (!existing.empty) {
    return { orderId: existing.docs[0]!.id, alreadyExists: true };
  }

  const userId = session.metadata?.userId;
  const addressId = session.metadata?.addressId;
  const cartItemsJson = session.metadata?.cartItems;
  const couponDiscount = Number(session.metadata?.couponDiscount || 0);

  if (!userId || !addressId || !cartItemsJson) {
    throw new Error("Missing session metadata");
  }

  const items: CartItem[] = JSON.parse(cartItemsJson);
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) throw new Error("User not found");

  const userData = userDoc.data()!;
  const address = ((userData.addresses || []) as Address[]).find(
    (a) => a.id === addressId
  );
  if (!address) throw new Error("Address not found");

  const batch = db.batch();

  for (const item of items) {
    const productRef = db.collection("products").doc(item.productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      throw new Error(`Product ${item.productId} not found`);
    }
    const stock = productSnap.data()!.stock as number;
    if (stock < item.quantity) {
      throw new Error(`Insufficient stock for ${item.name}`);
    }
    batch.update(productRef, { stock: stock - item.quantity });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = (subtotal * couponDiscount) / 100;
  const discountedSubtotal = subtotal - discount;
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + shipping + tax;

  const now = admin.firestore.Timestamp.now();
  const orderRef = db.collection("orders").doc();

  batch.set(orderRef, {
    userId,
    items: items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
    })),
    shippingAddress: address,
    subtotal: discountedSubtotal,
    shipping,
    tax,
    total,
    status: "confirmed",
    stripeSessionId,
    stripePaymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null,
    timeline: [
      {
        status: "confirmed",
        message: "Payment received",
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  return { orderId: orderRef.id, alreadyExists: false };
}
