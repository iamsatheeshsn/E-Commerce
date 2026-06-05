import { format } from "date-fns";
import { Truck, Calendar } from "lucide-react";
import { Order } from "@/types";

interface TrackingStatusProps {
  order: Order;
}

export function TrackingStatus({ order }: TrackingStatusProps) {
  if (!order.trackingNumber && !order.estimatedDelivery) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/20">
      <h3 className="mb-3 font-semibold">Tracking Information</h3>
      {order.trackingNumber && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-primary" />
          <span>
            Tracking #: <strong>{order.trackingNumber}</strong>
          </span>
        </div>
      )}
      {order.estimatedDelivery?.toDate?.() && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            Estimated delivery:{" "}
            <strong>
              {format(order.estimatedDelivery.toDate(), "dd MMM yyyy")}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
