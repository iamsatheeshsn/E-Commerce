"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { getProducts, getBrands } from "@/lib/firestore";
import { Product, ProductFilters } from "@/types";

export function useProducts(initialFilters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [brands, setBrands] = useState<string[]>([]);
  const pageOffsetRef = useRef(0);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const useOffsetPagingRef = useRef(false);

  useEffect(() => {
    getBrands().then(setBrands);
  }, []);

  const fetchProducts = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setLastDoc(null);
        lastDocRef.current = null;
        pageOffsetRef.current = 0;
        useOffsetPagingRef.current = false;
      } else {
        setLoadingMore(true);
      }

      const offset = reset ? 0 : pageOffsetRef.current;
      const activeFilters = { ...filters };
      if (activeFilters.search?.trim()) {
        activeFilters.sort = activeFilters.sort ?? "relevance";
      }

      const useOffset =
        useOffsetPagingRef.current ||
        !!activeFilters.search?.trim() ||
        !!activeFilters.brand ||
        activeFilters.minPrice !== undefined ||
        activeFilters.maxPrice !== undefined ||
        activeFilters.minRating !== undefined ||
        !!activeFilters.inStockOnly;

      try {
        const { products: newProducts, lastDoc: newLastDoc, hasMore: more } =
          await getProducts(
            activeFilters,
            12,
            useOffset || reset ? undefined : lastDocRef.current || undefined,
            offset
          );

        if (reset) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            const unique = newProducts.filter((p) => !seen.has(p.id));
            return [...prev, ...unique];
          });
        }

        if (newLastDoc) {
          lastDocRef.current = newLastDoc;
          setLastDoc(newLastDoc);
          useOffsetPagingRef.current = false;
        } else {
          useOffsetPagingRef.current = true;
          lastDocRef.current = null;
          setLastDoc(null);
        }

        setHasMore(more);
        pageOffsetRef.current = reset
          ? newProducts.length
          : pageOffsetRef.current + newProducts.length;
      } catch (err) {
        console.error("Failed to load products:", err);
        if (reset) setProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(true);
    }, filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [filters.category, filters.brand, filters.sort, filters.search, filters.minPrice, filters.maxPrice, filters.minRating, filters.inStockOnly]);

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchProducts(false);
  };

  const updateFilters = (updates: Partial<ProductFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if (updates.search !== undefined && updates.search?.trim()) {
        next.sort = "relevance";
      }
      return next;
    });
  };

  return {
    products,
    filters,
    brands,
    loading,
    loadingMore,
    hasMore,
    updateFilters,
    loadMore,
    refetch: () => fetchProducts(true),
  };
}
