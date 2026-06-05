"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
import Image from "next/image";

const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-surface transition-all",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border px-4 py-5",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="" width={36} height={36} />
            <div>
              <p className="text-sm font-bold text-foreground">{BRAND_NAME}</p>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Store className="h-3 w-3" /> Admin
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "border-l-[3px] border-primary bg-primary/10 text-primary"
                  : "text-muted hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="border-t border-border p-4">
          <p className="rounded-xl bg-gradient-to-br from-primary/10 to-cyan-500/10 p-3 text-xs leading-relaxed text-muted">
            Manage catalog, orders, and customers from your NovaCart admin console.
          </p>
        </div>
      )}
    </aside>
  );
}
