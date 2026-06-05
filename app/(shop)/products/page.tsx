"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilter } from "@/components/product/ProductFilter";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { SearchAutocomplete } from "@/components/layout/SearchAutocomplete";
import { getCategories } from "@/lib/firestore";
import { useState } from "react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || undefined;
  const initialCategory = searchParams.get("category") || undefined;

  const { products, filters, brands, loading, loadingMore, hasMore, updateFilters, loadMore } =
    useProducts({
      search: initialSearch,
      category: initialCategory,
      sort: "newest",
    });

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    getCategories().then((cats) => setCategories(cats.map((c) => c.name)));
  }, []);

  useEffect(() => {
    if (initialSearch) updateFilters({ search: initialSearch });
    if (initialCategory) updateFilters({ category: initialCategory });
  }, [initialSearch, initialCategory]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Catalog
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">All Products</h1>
        {(initialSearch || filters.search) && (
          <p className="mt-1 text-sm text-muted">
            Showing results for &ldquo;{filters.search || initialSearch}&rdquo;
          </p>
        )}
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-64 shrink-0">
          <ProductFilter
            filters={filters}
            brands={brands}
            categories={categories}
            onChange={updateFilters}
          />
        </div>
        <div className="flex-1">
          <div className="mb-6">
            <SearchAutocomplete
              variant="page"
              className="w-full"
              initialQuery={filters.search || initialSearch || ""}
              onSearch={(term) =>
                updateFilters({ search: term || undefined })
              }
            />
          </div>
          {loading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid products={products} />
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    loading={loadingMore}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
