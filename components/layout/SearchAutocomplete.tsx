"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, FolderOpen, Package, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { filterSearchSuggestions } from "@/lib/firestore";
import { useSearchCatalog } from "@/hooks/useSearchCatalog";

interface SuggestionProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
}

interface SuggestionCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
}

interface SearchAutocompleteProps {
  className?: string;
  inputClassName?: string;
  variant?: "navbar" | "page";
  initialQuery?: string;
  onSearch?: (term: string) => void;
}

export function SearchAutocomplete({
  className,
  inputClassName,
  variant = "navbar",
  initialQuery = "",
  onSearch,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const { catalog, loading: catalogLoading } = useSearchCatalog();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<SuggestionProduct[]>([]);
  const [categories, setCategories] = useState<SuggestionCategory[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const runSearch = useCallback(
    (term: string) => {
      const t = term.trim();
      if (t.length < 2 || !catalog) {
        setProducts([]);
        setCategories([]);
        return;
      }
      const result = filterSearchSuggestions(catalog, t);
      setProducts(result.products);
      setCategories(result.categories);
    },
    [catalog]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const goToSearch = (term: string) => {
    const t = term.trim();
    setOpen(false);
    if (onSearch) {
      onSearch(t);
      return;
    }
    if (!t) return;
    router.push(`/products?search=${encodeURIComponent(t)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch(query);
  };

  const hasResults = products.length > 0 || categories.length > 0;
  const showDropdown = open && query.trim().length >= 2;
  const isNavbar = variant === "navbar";
  const searching = catalogLoading && !catalog;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "flex w-full overflow-hidden transition-shadow",
            isNavbar
              ? "rounded-xl border border-border bg-surface shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
              : "rounded-xl border border-border bg-surface shadow-sm focus-within:ring-2 focus-within:ring-primary/30"
          )}
        >
          <input
            type="text"
            placeholder="Search products, brands & categories..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={cn(
              "flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted",
              inputClassName
            )}
            autoComplete="off"
            aria-label="Search"
            aria-expanded={showDropdown}
          />
          <button
            type="submit"
            className={cn(
              "flex items-center justify-center px-4 transition-colors",
              isNavbar
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-primary text-white hover:bg-primary-dark"
            )}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {searching && (
            <p className="px-4 py-3 text-sm text-muted">Loading catalog...</p>
          )}
          {!searching && !hasResults && (
            <p className="px-4 py-3 text-sm text-muted">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {!searching && !catalog && (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-accent">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Store data unavailable. Check Firebase config and run seed.
            </p>
          )}
          {!searching && categories.length > 0 && (
            <div className="border-b border-border">
              <p className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <FolderOpen className="h-3.5 w-3.5" /> Categories
              </p>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    router.push(
                      `/products?category=${encodeURIComponent(cat.name)}`
                    );
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-primary/5"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                    <Image
                      src={cat.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
          {!searching && products.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <Package className="h-3.5 w-3.5" /> Products
              </p>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/products/${p.id}`);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-primary/5"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      className="object-contain p-0.5"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.brand} · {formatPrice(p.price)}
                    </p>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToSearch(query)}
                className="w-full border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/5"
              >
                View all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
