"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrder } from "@/hooks/useOrders";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { TrackingStatus } from "@/components/order/TrackingStatus";
import { formatPrice, BLUR_DATA_URL, PLACEHOLDER_IMAGE } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { order, loading } = useOrder(id);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!order) {
    return <div className="py-16 text-center">Order not found</div>;
  }

  const addr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Order #{order.id.slice(-8).toUpperCase()}
        </h1>
        <Badge>{order.status}</Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-semibold">Order Timeline</h2>
          <OrderTimeline order={order} />
        </div>
        <div className="space-y-6">
          <TrackingStatus order={order} />

          <div className="rounded-lg border p-4 dark:border-gray-700">
            <h3 className="mb-3 font-semibold">Items</h3>
            {order.items.map((item) => (
              <div key={item.productId} className="mb-3 flex gap-3">
                <div className="relative h-16 w-16 shrink-0">
                  <Image
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt={item.name}
                    fill
                    className="object-contain"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.name}</p>
                  <p>Qty: {item.quantity}</p>
                  <p>{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 dark:border-gray-700">
            <h3 className="mb-3 font-semibold">Shipping Address</h3>
            <p className="text-sm">{addr.fullName}</p>
            <p className="text-sm text-gray-500">
              {addr.line1}
              {addr.line2 && `, ${addr.line2}`}
            </p>
            <p className="text-sm text-gray-500">
              {addr.city}, {addr.state} - {addr.pincode}
            </p>
            <p className="text-sm text-gray-500">{addr.phone}</p>
          </div>

          <div className="rounded-lg border p-4 dark:border-gray-700">
            <h3 className="mb-3 font-semibold">Payment Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
