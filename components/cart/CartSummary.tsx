"use client";

import Link from "next/link";
import { formatPrice, SHIPPING_FEE, TAX_RATE } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CartSummaryProps {
  subtotal: number;
  couponDiscount?: number;
  showCheckout?: boolean;
}

export function CartSummary({
  subtotal,
  couponDiscount = 0,
  showCheckout = true,
}: CartSummaryProps) {
  const discount = (subtotal * couponDiscount) / 100;
  const discounted = subtotal - discount;
  const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
  const tax = discounted * TAX_RATE;
  const total = discounted + shipping + tax;

  return (
    <div className="rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 font-semibold">Price Details</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon ({couponDiscount}%)</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (18%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-semibold dark:border-gray-600">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      {showCheckout && subtotal > 0 && (
        <Link href="/checkout" className="mt-4 block">
          <Button className="w-full" variant="secondary">
            Proceed to Checkout
          </Button>
        </Link>
      )}
    </div>
  );
}
