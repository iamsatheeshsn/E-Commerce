import Link from "next/link";
import { format } from "date-fns";
import { Order } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  pending: "warning",
  confirmed: "success",
  processing: "default",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const date = order.createdAt?.toDate?.()
    ? format(order.createdAt.toDate(), "dd MMM yyyy")
    : "—";

  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">Order #{order.id.slice(-8).toUpperCase()}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        <Badge variant={statusVariant[order.status] || "default"}>
          {order.status}
        </Badge>
      </div>
      <p className="mt-2 font-semibold">{formatPrice(order.total)}</p>
      <p className="text-sm text-gray-500">{order.items.length} item(s)</p>
      <Link
        href={`/orders/${order.id}`}
        className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
      >
        View Details →
      </Link>
    </div>
  );
}
