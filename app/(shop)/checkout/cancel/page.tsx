import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <XCircle className="mx-auto h-16 w-16 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold">Payment Cancelled</h1>
      <p className="mt-2 text-gray-500">
        Your payment was cancelled. Items are still in your cart.
      </p>
      <Link href="/cart" className="mt-8 inline-block">
        <Button variant="secondary">Return to Cart</Button>
      </Link>
    </div>
  );
}
