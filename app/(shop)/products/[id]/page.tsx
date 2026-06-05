"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Heart, Star, Minus, Plus } from "lucide-react";
import {
  getProduct,
  getRelatedProducts,
  getProductReviews,
} from "@/lib/firestore";
import { Product, Review } from "@/types";
import { formatPrice, calculateDiscount, BLUR_DATA_URL, PLACEHOLDER_IMAGE } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Spinner } from "@/components/ui/Spinner";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id).then(async (p) => {
      setProduct(p);
      if (p) {
        const [rel, rev] = await Promise.all([
          getRelatedProducts(p),
          getProductReviews(p.id),
        ]);
        setRelated(rel);
        setReviews(rev);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p>Product not found</p>
      </div>
    );
  }

  const discount = calculateDiscount(product.price, product.comparePrice);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast("Out of stock", "error");
      return;
    }
    addToCart(product, quantity);
    toast("Added to cart");
  };

  const handleWishlist = async () => {
    if (!user) {
      toast("Please sign in", "error");
      return;
    }
    await toggle(product.id);
    toast(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-white dark:border-gray-700 dark:bg-gray-900">
            <Image
              src={product.images[selectedImage] || product.images[0] || PLACEHOLDER_IMAGE}
              alt={product.name}
              fill
              className="object-contain p-4"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              priority
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded border ${
                  selectedImage === i ? "border-primary" : "border-gray-200"
                }`}
              >
                <Image src={img} alt="" fill className="object-contain p-1" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{product.brand}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-green-700 px-2 py-0.5 text-sm text-white">
              {product.rating} <Star className="h-3 w-3 fill-white" />
            </span>
            <span className="text-sm text-gray-500">
              ({product.reviewCount} reviews)
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(product.comparePrice)}
                </span>
                {discount > 0 && <Badge variant="accent">{discount}% off</Badge>}
              </>
            )}
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center rounded border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </span>
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </Button>
            <Button variant="outline" size="lg" onClick={handleWishlist}>
              <Heart
                className={`mr-2 h-5 w-5 ${wishlisted ? "fill-accent text-accent" : ""}`}
              />
              Wishlist
            </Button>
          </div>

          {Object.keys(product.specifications || {}).length > 0 && (
            <div className="mt-8">
              <h3 className="mb-3 font-semibold">Specifications</h3>
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <tr key={key} className="border-b dark:border-gray-700">
                      <td className="py-2 font-medium text-gray-500">{key}</td>
                      <td className="py-2">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Customer Reviews</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border p-4 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-green-700 px-1 text-xs text-white">
                    {r.rating}★
                  </span>
                  <span className="font-medium">{r.title}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {r.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold">Related Products</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
