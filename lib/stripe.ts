import Stripe from "stripe";
import { CartItem } from "@/types";
import { SHIPPING_FEE, TAX_RATE } from "@/lib/utils";
import { toAbsoluteImageUrl } from "@/lib/local-storage";

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export function calculateOrderTotals(items: CartItem[], couponDiscount = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = (subtotal * couponDiscount) / 100;
  const discountedSubtotal = subtotal - discount;
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + shipping + tax;
  return { subtotal, discount, shipping, tax, total };
}

export async function createCheckoutSession(params: {
  items: CartItem[];
  userId: string;
  addressId: string;
  userEmail: string;
  couponDiscount?: number;
}) {
  const stripe = getStripe();
  const { items, userId, addressId, userEmail, couponDiscount = 0 } = params;
  const { total } = calculateOrderTotals(items, couponDiscount);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
          images: item.image ? [toAbsoluteImageUrl(item.image)] : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })
  );

  if (couponDiscount > 0) {
    lineItems.push({
      price_data: {
        currency: "inr",
        product_data: { name: `Coupon discount (${couponDiscount}%)` },
        unit_amount: -Math.round(
          (items.reduce((s, i) => s + i.price * i.quantity, 0) *
            couponDiscount) /
            100 *
            100
        ),
      },
      quantity: 1,
    });
  }

  const shippingAmount = items.length > 0 ? SHIPPING_FEE : 0;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userEmail,
    line_items: lineItems,
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: Math.round(shippingAmount * 100), currency: "inr" },
          display_name: "Standard Shipping",
        },
      },
    ],
    payment_intent_data: {
      metadata: { userId, addressId },
    },
    metadata: {
      userId,
      addressId,
      cartItems: JSON.stringify(items),
      couponDiscount: String(couponDiscount),
    },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/cancel`,
  });

  return { session, total };
}
