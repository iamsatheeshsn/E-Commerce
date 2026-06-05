"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getAllOrdersAdmin, updateOrderStatus } from "@/lib/firestore";
import { useTablePagination } from "@/hooks/useTablePagination";
import { Order, OrderStatus } from "@/types";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice, PLACEHOLDER_IMAGE } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/components/ui/Toast";
import { X } from "lucide-react";
import Image from "next/image";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const UPDATE_STATUSES: { value: string; label: string }[] = STATUS_OPTIONS.filter(
  (s) => s.value !== ""
);

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(true);

  const {
    pageData: pagedOrders,
    page,
    totalPages,
    from,
    to,
    total,
    setPage,
    resetPage,
  } = useTablePagination(orders, 15);

  const loadOrders = () => {
    setLoading(true);
    getAllOrdersAdmin(
      statusFilter ? (statusFilter as OrderStatus) : undefined
    )
      .then((data) => {
        setOrders(data);
        resetPage();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  useEffect(() => {
    const orderId = searchParams.get("order");
    if (orderId && orders.length) {
      const order = orders.find((o) => o.id === orderId);
      if (order) setSelected(order);
    }
  }, [searchParams, orders]);

  const handleStatusUpdate = async () => {
    if (!selected) return;
    await updateOrderStatus(
      selected.id,
      newStatus,
      `Status updated to ${newStatus}`,
      trackingNumber || undefined
    );
    toast("Order updated");
    setSelected(null);
    loadOrders();
  };

  const columns = [
    {
      key: "id",
      header: "Order ID",
      render: (o: Order) => o.id.slice(-8).toUpperCase(),
    },
    {
      key: "userId",
      header: "User",
      render: (o: Order) => o.userId.slice(-6),
    },
    {
      key: "total",
      header: "Total",
      render: (o: Order) => formatPrice(o.total),
    },
    {
      key: "status",
      header: "Status",
      render: (o: Order) => <Badge>{o.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (o: Order) =>
        o.createdAt?.toDate?.()
          ? format(o.createdAt.toDate(), "dd MMM yyyy")
          : "—",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      <div className="mb-4 w-48">
        <Select
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading orders...</p>
      ) : (
        <DataTable
          columns={columns}
          data={pagedOrders}
          keyExtractor={(o) => o.id}
          onRowClick={setSelected}
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          total={total}
          onPageChange={setPage}
        />
      )}

      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSelected(null)}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-4 py-4 dark:border-gray-700">
              <h2 className="font-semibold">
                Order #{selected.id.slice(-8).toUpperCase()}
              </h2>
              <button onClick={() => setSelected(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Badge>{selected.status}</Badge>
              <p className="text-sm">Total: {formatPrice(selected.total)}</p>

              <div>
                <h3 className="mb-2 font-medium text-sm">Items</h3>
                {selected.items.map((item) => (
                  <div key={item.productId} className="mb-2 flex gap-2 text-sm">
                    <div className="relative h-12 w-12">
                      <Image
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <p>{item.name}</p>
                      <p>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Select
                label="Update Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                options={UPDATE_STATUSES}
              />

              <Input
                label="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />

              <Button onClick={handleStatusUpdate}>Update Order</Button>

              <div className="text-xs text-gray-500">
                <h3 className="font-medium mb-1">Timeline</h3>
                {selected.timeline?.map((e, i) => (
                  <p key={i}>
                    {e.status}: {e.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrdersContent />
    </Suspense>
  );
}
