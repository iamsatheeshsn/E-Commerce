"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { getWishlistProducts } from "@/lib/firestore";
import { Product } from "@/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { wishlistIds, remove } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getWishlistProducts(user.uid)
        .then(setProducts)
        .finally(() => setLoading(false));
    }
  }, [user, wishlistIds]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 text-accent" /> My Wishlist
      </h1>
      {products.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          Your wishlist is empty. Save products you love!
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <ProductGrid products={[product]} />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    addToCart(product);
                    toast("Added to cart");
                  }}
                >
                  Add to Cart
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await remove(product.id);
                    toast("Removed from wishlist");
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
