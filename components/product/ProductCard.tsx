"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import { Product } from "@/types";
import {
  formatPrice,
  calculateDiscount,
  BLUR_DATA_URL,
  PLACEHOLDER_IMAGE,
} from "@/lib/utils";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const { toast } = useToast();
  const discount = calculateDiscount(product.price, product.comparePrice);
  const wishlisted = isWishlisted(product.id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast("Please sign in to use wishlist", "error");
      return;
    }
    try {
      await toggle(product.id);
      toast(wishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      toast("Failed to update wishlist", "error");
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        <Image
          src={product.images[0] || PLACEHOLDER_IMAGE}
          alt={product.name}
          fill
          className="object-contain p-5 transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-lg bg-accent px-2 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </span>
        )}

        <button
          onClick={handleWishlist}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition hover:scale-110 dark:bg-slate-900/90"
        >
          <Heart
            className={`h-4 w-4 ${wishlisted ? "fill-accent text-accent" : "text-slate-400"}`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
          {product.brand}
        </p>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>

        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviewCount.toLocaleString()})</span>
        </div>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {product.stock === 0 && (
          <span className="mt-2 text-xs font-medium text-accent">
            Out of stock
          </span>
        )}
      </div>
    </Link>
  );
}
