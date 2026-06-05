import Link from "next/link";
import Image from "next/image";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <Image src="/logo.svg" alt="" width={36} height={36} />
              <span className="text-lg font-bold text-white">{BRAND_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed">
              {BRAND_TAGLINE} Curated electronics, fashion, home, beauty and more
              — delivered with care.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Shop
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                ["All Products", "/products"],
                ["Electronics", "/products?category=Electronics"],
                ["Fashion", "/products?category=Fashion"],
                ["Beauty", "/products?category=Beauty"],
                ["Deals", "/products"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="transition hover:text-primary-light">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="transition hover:text-primary-light">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/orders" className="transition hover:text-primary-light">
                  Track Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="transition hover:text-primary-light">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>help@novacart.com</li>
              <li>1800-NOVA-HELP</li>
              <li>Mon–Sat, 9am–8pm IST</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
