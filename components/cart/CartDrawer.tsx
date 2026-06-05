"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { CartItemRow } from "./CartItem";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const {
    items,
    isOpen,
    setOpen,
    removeItem,
    updateQuantity,
    subtotal,
    couponDiscount,
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b px-4 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <button onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>Your cart is empty</p>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="mt-4 inline-block text-primary hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 dark:border-gray-700">
            <CartSummary
              subtotal={subtotal}
              couponDiscount={couponDiscount}
            />
          </div>
        )}
      </div>
    </>
  );
}
