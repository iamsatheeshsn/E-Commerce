import type { Category, Product } from "@/types";

export function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

export function productSearchScore(product: Product, term: string): number {
  const t = normalizeSearchTerm(term);
  if (!t) return 0;

  const name = (product.name ?? "").toLowerCase();
  const brand = (product.brand ?? "").toLowerCase();
  const category = (product.category ?? "").toLowerCase();
  const tags = (product.tags || []).join(" ").toLowerCase();

  if (name === t || brand === t || category === t) return 100;
  if (name.startsWith(t)) return 90;
  if (brand.startsWith(t)) return 85;
  if (category.startsWith(t)) return 80;
  if (name.includes(t)) return 70;
  if (brand.includes(t)) return 65;
  if (category.includes(t)) return 60;
  if (tags.includes(t)) return 50;

  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const haystack = `${name} ${brand} ${category} ${tags}`;
    if (words.every((w) => haystack.includes(w))) return 45;
  }

  return 0;
}

export function matchesProductSearch(product: Product, term: string): boolean {
  return productSearchScore(product, term) > 0;
}

export function matchesCategorySearch(category: Category, term: string): boolean {
  const t = normalizeSearchTerm(term);
  if (!t) return false;
  return (
    category.name.toLowerCase().includes(t) ||
    category.slug.toLowerCase().includes(t) ||
    (category.description?.toLowerCase().includes(t) ?? false)
  );
}

export function sortProductsByRelevance(
  products: Product[],
  term: string
): Product[] {
  return [...products].sort(
    (a, b) => productSearchScore(b, term) - productSearchScore(a, term)
  );
}
