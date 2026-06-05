"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ShoppingCart,
  Heart,
  User,
  Moon,
  Sun,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useTheme } from "@/app/providers";
import { Logo } from "@/components/ui/Logo";
import { SearchAutocomplete } from "@/components/layout/SearchAutocomplete";

const categoryLinks = [
  { label: "Electronics", href: "/products?category=Electronics" },
  { label: "Fashion", href: "/products?category=Fashion" },
  { label: "Home", href: "/products?category=Home%20%26%20Kitchen" },
  { label: "Beauty", href: "/products?category=Beauty" },
  { label: "Sports", href: "/products?category=Sports%20%26%20Fitness" },
  { label: "Books", href: "/products?category=Books%20%26%20Stationery" },
  { label: "Toys", href: "/products?category=Toys%20%26%20Games" },
  { label: "Grocery", href: "/products?category=Groceries%20%26%20Gourmet" },
];

export function Navbar() {
  const { user, userProfile, loading, signOut, isAdmin } = useAuth();
  const { itemCount, setOpen } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-surface shadow-nav">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-6">
        <Logo href="/" variant="dark" />

        <SearchAutocomplete className="hidden flex-1 md:block md:max-w-xl lg:max-w-2xl" />

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="hidden rounded-xl p-2.5 text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800 sm:block"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {!loading && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-foreground transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {userProfile?.photoURL ? (
                  <Image
                    src={userProfile.photoURL}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-primary/20"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </span>
                )}
                <span className="hidden max-w-[90px] truncate font-medium md:inline">
                  {userProfile?.displayName || "Account"}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl">
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Package className="h-4 w-4 text-primary" /> My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" /> Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-accent hover:bg-primary/5"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/wishlist"
            className="relative rounded-xl p-2.5 text-muted transition hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-800"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="relative rounded-xl p-2.5 text-muted transition hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      <div className="hidden border-t border-border md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
          <Link
            href="/products"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            All Products
          </Link>
          {categoryLinks.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-4 pb-3 pt-2 md:hidden">
        <SearchAutocomplete className="w-full" />
      </div>
    </header>
  );
}
