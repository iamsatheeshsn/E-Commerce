"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { CartItemRow } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    couponCode,
    couponDiscount,
    applyCoupon,
  } = useCart();
  const { toast } = useToast();
  const [couponInput, setCouponInput] = useState("");

  const handleCoupon = () => {
    if (applyCoupon(couponInput)) {
      toast("Coupon applied! 10% discount");
    } else {
      toast("Invalid coupon code", "error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h2 className="mt-4 text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-gray-500">
          Add items to your cart to continue shopping
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button variant="secondary">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          {items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Enter coupon code (SAVE10)"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
            />
            <Button variant="outline" onClick={handleCoupon}>
              Apply
            </Button>
          </div>
          {couponDiscount > 0 && (
            <p className="mt-2 text-sm text-green-600">
              Coupon {couponCode} applied — {couponDiscount}% off
            </p>
          )}
        </div>
        <div>
          <CartSummary subtotal={subtotal} couponDiscount={couponDiscount} />
        </div>
      </div>
    </div>
  );
}
