"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-4 text-2xl font-bold">Order Confirmed!</h1>
      <p className="mt-2 text-gray-500">
        Thank you for your purchase. Your payment was successful.
      </p>
      {sessionId && (
        <p className="mt-2 text-xs text-gray-400">
          Session: {sessionId.slice(0, 20)}...
        </p>
      )}
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/orders">
          <Button>View Orders</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
