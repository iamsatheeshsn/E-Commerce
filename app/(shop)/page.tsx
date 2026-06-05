"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Truck,
  Shield,
  Award,
} from "lucide-react";
import {
  getCategories,
  getFeaturedProducts,
  getDealsProducts,
} from "@/lib/firestore";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HERO_SLIDES } from "@/lib/banners";
import { BLUR_DATA_URL } from "@/lib/utils";
import { Category, Product } from "@/types";
import { isFirebaseConfigured } from "@/lib/firebase";

const perks = [
  {
    icon: Truck,
    label: "Free Delivery",
    sub: "On orders above ₹499",
    color: "bg-teal-500/10 text-teal-600",
  },
  {
    icon: Shield,
    label: "Secure Checkout",
    sub: "Stripe-powered payments",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    icon: Award,
    label: "Top Rated",
    sub: "Curated quality picks",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Zap,
    label: "Fast Dispatch",
    sub: "Ships within 24 hours",
    color: "bg-orange-500/10 text-orange-600",
  },
];

const brands = [
  "Samsung",
  "Apple",
  "Nike",
  "Sony",
  "Philips",
  "Garmin",
  "Puma",
  "Bosch",
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError(
        "Firebase is not configured. Copy .env.local.example to .env.local, add your keys, then restart: npm run dev"
      );
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, feat, dealProducts] = await Promise.all([
          getCategories().catch(() => [] as Category[]),
          getFeaturedProducts(16).catch(() => [] as Product[]),
          getDealsProducts(8).catch(() => [] as Product[]),
        ]);
        setCategories(cats);
        setFeatured(feat);
        setDeals(dealProducts);
        if (cats.length === 0 && feat.length === 0 && dealProducts.length === 0) {
          setError(
            "No data loaded. Run npm run seed and deploy Firestore rules: firebase deploy --only firestore"
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load store data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      {error && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
            {error}
          </div>
        </div>
      )}

      <HeroSlider slides={HERO_SLIDES} />

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 lg:grid-cols-4">
          {perks.map(({ icon: Icon, label, sub, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{label}</p>
                <p className="truncate text-xs text-muted">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-border bg-slate-50 py-6 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted">
            Trusted Brands
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/products?search=${encodeURIComponent(brand)}`}
                className="text-sm font-semibold text-slate-500 transition hover:text-primary dark:text-slate-400"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Categories
            </p>
            <h2 className="section-title">Shop by Department</h2>
          </div>
          <Link
            href="/products"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-semibold text-white">{cat.name}</p>
                    {cat.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-white/75">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-br from-primary/8 via-transparent to-cyan-500/5 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-accent">
                <Sparkles className="h-4 w-4" /> Limited time
              </p>
              <h2 className="section-title">Deals of the Day</h2>
            </div>
            <Link
              href="/products"
              className="text-sm font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <ProductGrid products={deals} />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Trending
            </p>
            <h2 className="section-title">Popular Right Now</h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        {loading ? <ProductGridSkeleton /> : <ProductGrid products={featured} />}
      </section>

      <section className="border-t border-border bg-slate-900 py-14">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Get deals in your inbox
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Subscribe for exclusive offers, new arrivals, and style inspiration.
          </p>
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
