"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/app/providers";
import { Moon, Sun, LogOut, ExternalLink, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/users": "Users",
  "/admin/reviews": "Reviews",
};

export function AdminHeader() {
  const { userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "Admin";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div>
        <p className="text-xs font-medium text-muted">NovaCart Console</p>
        <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-muted md:inline">
          Hi, {userProfile?.displayName || "Admin"}
        </span>
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted transition hover:border-primary hover:text-primary sm:flex"
        >
          <ExternalLink className="h-4 w-4" />
          Store
        </Link>
        <button
          className="rounded-xl p-2 text-muted transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-muted transition hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
