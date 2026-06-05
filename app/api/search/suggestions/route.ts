import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  matchesCategorySearch,
  matchesProductSearch,
  productSearchScore,
} from "@/lib/search";
import type { Category, Product } from "@/types";
import { DEFAULT_CATEGORY_IMAGE, PLACEHOLDER_IMAGE } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  try {
    const db = getAdminDb();
    const [productsSnap, categoriesSnap] = await Promise.all([
      db.collection("products").where("isActive", "==", true).limit(200).get(),
      db.collection("categories").limit(50).get(),
    ]);

    const products = productsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Product)
      .filter((p) => matchesProductSearch(p, q))
      .sort((a, b) => productSearchScore(b, q) - productSearchScore(a, q))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        image: p.images?.[0] ?? "/uploads/defaults/product.jpg",
        price: p.price,
      }));

    const categories = categoriesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Category)
      .filter((c) => matchesCategorySearch(c, q))
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image || DEFAULT_CATEGORY_IMAGE,
      }));

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { error: "Search failed", products: [], categories: [] },
      { status: 500 }
    );
  }
}
