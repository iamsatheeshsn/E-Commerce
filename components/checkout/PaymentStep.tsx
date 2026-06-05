"use client";

import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CartItem } from "@/types";

interface PaymentStepProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  onPay: () => void;
  loading?: boolean;
}

export function PaymentStep({
  items,
  subtotal,
  shipping,
  tax,
  total,
  onPay,
  loading,
}: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 dark:border-gray-700">
        <h3 className="mb-4 font-semibold">Order Items</h3>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t pt-4 text-sm dark:border-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (18%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={onPay}
        loading={loading}
      >
        Pay with Stripe
      </Button>
      <p className="text-center text-xs text-gray-500">
        You will be redirected to Stripe secure checkout
      </p>
    </div>
  );
}
