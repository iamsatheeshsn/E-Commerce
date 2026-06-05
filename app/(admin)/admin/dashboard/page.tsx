"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  MessageSquare,
} from "lucide-react";
import { getAdminStats, getRecentOrders, getLowStockProducts } from "@/lib/firestore";
import { AdminStats, Order, Product } from "@/types";
import { StatsCard } from "@/components/admin/StatsCard";
import { DataTable } from "@/components/admin/DataTable";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import Link from "next/link";

const quickLinks = [
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    Promise.all([
      getAdminStats(),
      getRecentOrders(10),
      getLowStockProducts(10),
    ]).then(([s, orders, stock]) => {
      setStats(s);
      setRecentOrders(orders);
      setLowStock(stock);
    });
  }, []);

  const orderColumns = [
    {
      key: "id",
      header: "Order ID",
      render: (o: Order) => o.id.slice(-8).toUpperCase(),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (o: Order) =>
        o.createdAt?.toDate?.()
          ? format(o.createdAt.toDate(), "dd MMM yyyy")
          : "—",
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
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Overview
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Store performance, orders, and inventory at a glance
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm font-medium shadow-card transition hover:-translate-y-0.5 hover:border-primary hover:shadow-card-hover"
          >
            <Icon className="h-6 w-6 text-primary" />
            {label}
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={stats?.totalRevenue ?? 0}
          icon={IndianRupee}
          isCurrency
          accent="primary"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingBag}
          accent="accent"
        />
        <StatsCard
          title="Total Products"
          value={stats?.totalProducts ?? 0}
          icon={Package}
          accent="emerald"
        />
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          accent="amber"
        />
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-4 font-semibold">Revenue (Last 30 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.revenueByDay || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                fontSize={10}
              />
              <YAxis fontSize={10} />
              <Tooltip
                formatter={(value) => formatPrice(Number(value ?? 0))}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="revenue" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-semibold">Recent Orders</h2>
          <DataTable
            columns={orderColumns}
            data={recentOrders}
            keyExtractor={(o) => o.id}
            onRowClick={(o) =>
              (window.location.href = `/admin/orders?order=${o.id}`)
            }
          />
        </div>
        <div>
          <h2 className="mb-4 font-semibold text-red-600">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">All products well stocked</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-sm"
                >
                  <Link
                    href="/admin/products"
                    className="hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <span className="font-medium text-red-500">
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
