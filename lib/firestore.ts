import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
  arrayUnion,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  User,
  Product,
  Order,
  Review,
  Category,
  Address,
  ProductFilters,
  OrderStatus,
  AdminStats,
} from "@/types";
import { generateId, stripUndefined } from "@/lib/utils";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  matchesCategorySearch,
  matchesProductSearch,
  productSearchScore,
  sortProductsByRelevance,
} from "@/lib/search";
import { DEFAULT_CATEGORY_IMAGE, PLACEHOLDER_IMAGE } from "@/lib/utils";

function assertDb() {
  if (!isFirebaseConfigured() || !db) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local and restart the dev server (npm run dev)."
    );
  }
  return db;
}

function mapProductDocs(
  docs: { id: string; data: () => DocumentData }[]
): Product[] {
  return docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
}

/** Simple query — works without composite indexes (for dev / fallback). */
async function getAllActiveProducts(limitCount = 100): Promise<Product[]> {
  const database = assertDb();
  const snap = await getDocs(
    query(
      collection(database, "products"),
      where("isActive", "==", true),
      limit(limitCount)
    )
  );
  return mapProductDocs(snap.docs);
}

function sortProducts(
  products: Product[],
  sort: ProductFilters["sort"] = "newest"
): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "relevance":
      return sorted;
    case "newest":
    default:
      return sorted.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
  }
}

// Users
export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as User;
}

export async function updateUserAddresses(
  uid: string,
  addresses: Address[]
): Promise<void> {
  await updateDoc(doc(assertDb(), "users", uid), { addresses });
}

export async function addUserAddress(
  uid: string,
  address: Omit<Address, "id">
): Promise<Address> {
  const user = await getUser(uid);
  const newAddress: Address = { ...address, id: generateId() };
  const addresses = [...(user?.addresses || [])];
  if (newAddress.isDefault) {
    addresses.forEach((a) => (a.isDefault = false));
  }
  addresses.push(newAddress);
  await updateUserAddresses(uid, addresses);
  return newAddress;
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const database = assertDb();
  const snap = await getDocs(collection(database, "categories"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
}

/** Products + categories for client-side search autocomplete */
export async function getSearchCatalog(): Promise<{
  products: Product[];
  categories: Category[];
}> {
  const database = assertDb();
  const [productsSnap, categoriesSnap] = await Promise.all([
    getDocs(
      query(
        collection(database, "products"),
        where("isActive", "==", true),
        limit(500)
      )
    ),
    getDocs(collection(database, "categories")),
  ]);
  return {
    products: mapProductDocs(productsSnap.docs),
    categories: categoriesSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Category
    ),
  };
}

export function filterSearchSuggestions(
  catalog: { products: Product[]; categories: Category[] },
  term: string
): {
  products: {
    id: string;
    name: string;
    brand: string;
    category: string;
    image: string;
    price: number;
  }[];
  categories: {
    id: string;
    name: string;
    slug: string;
    image: string;
  }[];
} {
  const q = term.trim();
  if (q.length < 2) return { products: [], categories: [] };

  const products = catalog.products
    .filter((p) => matchesProductSearch(p, q))
    .sort((a, b) => productSearchScore(b, q) - productSearchScore(a, q))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      image: p.images?.[0] ?? PLACEHOLDER_IMAGE,
      price: p.price,
    }));

  const categories = catalog.categories
    .filter((c) => matchesCategorySearch(c, q))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image || DEFAULT_CATEGORY_IMAGE,
    }));

  return { products, categories };
}

export async function createCategory(
  data: Omit<Category, "id">
): Promise<string> {
  const database = assertDb();
  const ref = doc(collection(database, "categories"));
  await setDoc(ref, stripUndefined(data as Record<string, unknown>));
  return ref.id;
}

export async function updateCategory(
  id: string,
  data: Partial<Category>
): Promise<void> {
  await updateDoc(
    doc(assertDb(), "categories", id),
    stripUndefined(data as Record<string, unknown>)
  );
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(assertDb(), "categories", id));
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(assertDb(), "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as User);
}

export async function updateUserRole(
  uid: string,
  role: "customer" | "admin"
): Promise<void> {
  await updateDoc(doc(assertDb(), "users", uid), { role });
}

export async function getAllReviews(): Promise<Review[]> {
  try {
    const q = query(
      collection(assertDb(), "reviews"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  } catch {
    const snap = await getDocs(collection(assertDb(), "reviews"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  }
}

export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(assertDb(), "reviews", id));
}

// Products
function applyClientFilters(
  products: Product[],
  filters: ProductFilters
): Product[] {
  let result = [...products];
  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.minRating !== undefined) {
    result = result.filter((p) => p.rating >= filters.minRating!);
  }
  if (filters.inStockOnly) {
    result = result.filter((p) => p.stock > 0);
  }
  if (filters.brand) {
    result = result.filter(
      (p) => p.brand.toLowerCase() === filters.brand!.toLowerCase()
    );
  }
  return result;
}

function paginateProducts(
  products: Product[],
  pageSize: number,
  pageOffset: number
): { products: Product[]; hasMore: boolean } {
  const slice = products.slice(pageOffset, pageOffset + pageSize);
  return {
    products: slice,
    hasMore: pageOffset + slice.length < products.length,
  };
}

async function getFilteredProductsClient(
  filters: ProductFilters,
  searchTerm?: string
): Promise<Product[]> {
  let products = await getAllActiveProducts(500);

  if (filters.category) {
    products = products.filter((p) => p.category === filters.category);
  }

  if (searchTerm) {
    products = products.filter((p) => matchesProductSearch(p, searchTerm));
  }

  products = applyClientFilters(products, filters);

  if (filters.brand) {
    products = products.filter(
      (p) => p.brand.toLowerCase() === filters.brand!.toLowerCase()
    );
  }

  if (searchTerm && filters.sort === "relevance") {
    return sortProductsByRelevance(products, searchTerm);
  }

  return sortProducts(products, filters.sort);
}

export async function getProducts(
  filters: ProductFilters = {},
  pageSize = 12,
  cursor?: QueryDocumentSnapshot<DocumentData>,
  pageOffset = 0
): Promise<{
  products: Product[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  const database = assertDb();
  const searchTerm = filters.search?.trim();

  const needsClientPagination =
    !!searchTerm ||
    !!filters.brand ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    !!filters.inStockOnly;

  if (needsClientPagination) {
    const all = await getFilteredProductsClient(filters, searchTerm);
    const { products, hasMore } = paginateProducts(all, pageSize, pageOffset);
    return { products, lastDoc: null, hasMore };
  }

  try {
    const filterConstraints = [where("isActive", "==", true)];

    if (filters.category) {
      filterConstraints.push(where("category", "==", filters.category));
    }

    let orderField = "createdAt";
    let orderDir: "asc" | "desc" = "desc";

    switch (filters.sort) {
      case "price-asc":
        orderField = "price";
        orderDir = "asc";
        break;
      case "price-desc":
        orderField = "price";
        orderDir = "desc";
        break;
      case "rating":
        orderField = "rating";
        orderDir = "desc";
        break;
      case "newest":
      default:
        orderField = "createdAt";
        orderDir = "desc";
    }

    const queryConstraints = [
      ...filterConstraints,
      orderBy(orderField, orderDir),
      limit(pageSize + 1),
    ];

    let q = query(collection(database, "products"), ...queryConstraints);
    if (cursor) {
      q = query(
        collection(database, "products"),
        ...queryConstraints,
        startAfter(cursor)
      );
    }

    const snap = await getDocs(q);
    const docs = snap.docs;
    const hasMoreInDb = docs.length > pageSize;
    const pageDocs = hasMoreInDb ? docs.slice(0, pageSize) : docs;
    const products = mapProductDocs(pageDocs);
    const lastVisible =
      pageDocs.length > 0 ? pageDocs[pageDocs.length - 1]! : null;

    return {
      products,
      lastDoc: lastVisible,
      hasMore: hasMoreInDb,
    };
  } catch (error) {
    console.warn(
      "Indexed product query failed (deploy firestore indexes). Using client-side fallback.",
      error
    );

    const all = await getFilteredProductsClient(filters);
    const { products, hasMore } = paginateProducts(all, pageSize, pageOffset);
    return { products, lastDoc: null, hasMore };
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, "products", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function getFeaturedProducts(count = 8): Promise<Product[]> {
  assertDb();
  try {
    const q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      orderBy("rating", "desc"),
      limit(count)
    );
    const snap = await getDocs(q);
    return mapProductDocs(snap.docs);
  } catch (error) {
    console.warn("getFeaturedProducts fallback:", error);
    const all = await getAllActiveProducts();
    return sortProducts(all, "rating").slice(0, count);
  }
}

export async function getDealsProducts(count = 6): Promise<Product[]> {
  assertDb();
  try {
    const q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      orderBy("price", "asc"),
      limit(count * 3)
    );
    const snap = await getDocs(q);
    const products = mapProductDocs(snap.docs);
    return products
      .filter((p) => p.comparePrice && p.comparePrice > p.price)
      .slice(0, count);
  } catch (error) {
    console.warn("getDealsProducts fallback:", error);
    const all = await getAllActiveProducts();
    return all
      .filter((p) => p.comparePrice && p.comparePrice > p.price)
      .sort((a, b) => a.price - b.price)
      .slice(0, count);
  }
}

export async function getRelatedProducts(
  product: Product,
  count = 4
): Promise<Product[]> {
  assertDb();
  try {
    const q = query(
      collection(db, "products"),
      where("isActive", "==", true),
      where("category", "==", product.category),
      orderBy("rating", "desc"),
      limit(count + 1)
    );
    const snap = await getDocs(q);
    return mapProductDocs(snap.docs)
      .filter((p) => p.id !== product.id)
      .slice(0, count);
  } catch (error) {
    console.warn("getRelatedProducts fallback:", error);
    const all = await getAllActiveProducts();
    return sortProducts(
      all.filter(
        (p) => p.id !== product.id && p.category === product.category
      ),
      "rating"
    ).slice(0, count);
  }
}

export async function getAllProductsAdmin(
  pageSize = 20,
  cursor?: QueryDocumentSnapshot<DocumentData>
): Promise<{ products: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(db, "products"),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  if (cursor) {
    q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc"),
      startAfter(cursor),
      limit(pageSize)
    );
  }
  const snap = await getDocs(q);
  return {
    products: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
  };
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt">
): Promise<string> {
  const ref = doc(collection(db, "products"));
  await setDoc(
    ref,
    stripUndefined({
      ...data,
      createdAt: serverTimestamp(),
    } as Record<string, unknown>)
  );
  return ref.id;
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  await updateDoc(
    doc(db, "products", id),
    stripUndefined(data as Record<string, unknown>)
  );
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

/** @deprecated Use uploadImage from lib/upload.ts */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const { uploadImage } = await import("@/lib/upload");
  return uploadImage(file, "products", productId);
}

// Wishlist
export async function getWishlist(uid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, "users", uid, "wishlist"));
  return snap.docs.map((d) => d.id);
}

export function subscribeWishlist(
  uid: string,
  callback: (ids: string[]) => void
) {
  return onSnapshot(collection(db, "users", uid, "wishlist"), (snap) => {
    callback(snap.docs.map((d) => d.id));
  });
}

export async function addToWishlist(uid: string, productId: string) {
  await setDoc(doc(db, "users", uid, "wishlist", productId), {
    productId,
    addedAt: serverTimestamp(),
  });
}

export async function removeFromWishlist(uid: string, productId: string) {
  await deleteDoc(doc(db, "users", uid, "wishlist", productId));
}

export async function getWishlistProducts(uid: string): Promise<Product[]> {
  const ids = await getWishlist(uid);
  const products: Product[] = [];
  for (const id of ids) {
    const p = await getProduct(id);
    if (p) products.push(p);
  }
  return products;
}

// Orders
export async function getUserOrders(uid: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export function subscribeOrder(
  id: string,
  callback: (order: Order | null) => void
) {
  return onSnapshot(doc(db, "orders", id), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Order);
  });
}

export async function getAllOrdersAdmin(
  statusFilter?: OrderStatus
): Promise<Order[]> {
  let q;
  if (statusFilter) {
    q = query(
      collection(db, "orders"),
      where("status", "==", statusFilter),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  message: string,
  trackingNumber?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
    timeline: arrayUnion({
      status,
      message,
      timestamp: Timestamp.now(),
    }),
  };
  if (trackingNumber !== undefined) {
    updates.trackingNumber = trackingNumber;
  }
  await updateDoc(doc(db, "orders", orderId), updates);
}

// Reviews
export async function getProductReviews(productId: string): Promise<Review[]> {
  const database = assertDb();
  try {
    const q = query(
      collection(database, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review);
  } catch {
    const snap = await getDocs(
      query(
        collection(database, "reviews"),
        where("productId", "==", productId),
        limit(50)
      )
    );
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Review)
      .sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      )
      .slice(0, 20);
  }
}

// Admin stats
export async function getAdminStats(): Promise<AdminStats> {
  const [productsSnap, ordersSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, "products")),
    getDocs(collection(db, "orders")),
    getDocs(collection(db, "users")),
  ]);

  const orders = ordersSnap.docs.map((d) => d.data());
  const totalRevenue = orders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  );

  const revenueByDay: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0]!;
    revenueByDay[key] = 0;
  }

  orders.forEach((o) => {
    const created = o.createdAt?.toDate?.() || new Date();
    const key = created.toISOString().split("T")[0]!;
    if (revenueByDay[key] !== undefined) {
      revenueByDay[key] += o.total || 0;
    }
  });

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: productsSnap.size,
    totalUsers: usersSnap.size,
    revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    })),
  };
}

export async function getLowStockProducts(threshold = 10): Promise<Product[]> {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Product)
    .filter((p) => p.stock < threshold)
    .slice(0, 10);
}

export async function getRecentOrders(count = 10): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
}

export async function getBrands(): Promise<string[]> {
  const snap = await getDocs(collection(db, "products"));
  const brands = new Set<string>();
  snap.docs.forEach((d) => {
    const brand = d.data().brand;
    if (brand) brands.add(brand);
  });
  return Array.from(brands).sort();
}
