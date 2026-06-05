"use client";

import { useEffect, useState } from "react";
import { getSearchCatalog } from "@/lib/firestore";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { Category, Product } from "@/types";

let cachedCatalog: { products: Product[]; categories: Category[] } | null =
  null;
let catalogPromise: Promise<{
  products: Product[];
  categories: Category[];
}> | null = null;

function loadCatalog() {
  if (cachedCatalog) return Promise.resolve(cachedCatalog);
  if (!catalogPromise) {
    catalogPromise = getSearchCatalog()
      .then((data) => {
        cachedCatalog = data;
        return data;
      })
      .catch(() => {
        catalogPromise = null;
        return { products: [], categories: [] };
      });
  }
  return catalogPromise;
}

export function useSearchCatalog() {
  const [catalog, setCatalog] = useState(cachedCatalog);
  const [loading, setLoading] = useState(!cachedCatalog);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    loadCatalog().then((data) => {
      setCatalog(data);
      setLoading(false);
    });
  }, []);

  return { catalog, loading };
}

export function invalidateSearchCatalog() {
  cachedCatalog = null;
  catalogPromise = null;
}
