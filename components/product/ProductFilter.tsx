"use client";

import { ProductFilters } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface ProductFilterProps {
  filters: ProductFilters;
  brands: string[];
  categories: string[];
  onChange: (updates: Partial<ProductFilters>) => void;
}

export function ProductFilter({
  filters,
  brands,
  categories,
  onChange,
}: ProductFilterProps) {
  return (
    <aside className="sticky top-24 space-y-6 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="font-semibold">Filters</h2>

      <Select
        label="Category"
        value={filters.category || ""}
        onChange={(e) =>
          onChange({ category: e.target.value || undefined })
        }
        options={[
          { value: "", label: "All Categories" },
          ...categories.map((c) => ({ value: c, label: c })),
        ]}
      />

      <Select
        label="Brand"
        value={filters.brand || ""}
        onChange={(e) => onChange({ brand: e.target.value || undefined })}
        options={[
          { value: "", label: "All Brands" },
          ...brands.map((b) => ({ value: b, label: b })),
        ]}
      />

      <div>
        <label className="mb-2 block text-sm font-medium">Price Range</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <input
          type="range"
          min={0}
          max={100000}
          step={500}
          value={filters.maxPrice ?? 50000}
          onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
          className="mt-2 w-full accent-primary"
        />
      </div>

      <Select
        label="Minimum Rating"
        value={String(filters.minRating ?? "")}
        onChange={(e) =>
          onChange({
            minRating: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        options={[
          { value: "", label: "Any" },
          { value: "4", label: "4★ & above" },
          { value: "3", label: "3★ & above" },
          { value: "2", label: "2★ & above" },
        ]}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={filters.inStockOnly || false}
          onChange={(e) => onChange({ inStockOnly: e.target.checked })}
          className="accent-primary"
        />
        In stock only
      </label>

      <Select
        label="Sort by"
        value={filters.sort || "newest"}
        onChange={(e) =>
          onChange({
            sort: e.target.value as ProductFilters["sort"],
          })
        }
        options={[
          { value: "relevance", label: "Relevance" },
          { value: "price-asc", label: "Price: Low to High" },
          { value: "price-desc", label: "Price: High to Low" },
          { value: "newest", label: "Newest" },
          { value: "rating", label: "Top Rated" },
        ]}
      />
    </aside>
  );
}
