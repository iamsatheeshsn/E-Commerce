import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import { resolve } from "path";
import fs from "fs/promises";
import path from "path";
import {
  bannerSeed,
  categorySeed,
  productSeed,
} from "./seed-data";
import {
  customerSeed,
  orderSeed,
  reviewSeed,
  wishlistSeed,
  SEED_CUSTOMER_PASSWORD,
} from "./seed-extra-data";
import type { OrderStatus } from "../types";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

const BATCH_SIZE = 500;
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const SHIPPING_FEE = 49;
const TAX_RATE = 0.18;

interface ProductCatalogEntry {
  id: string;
  name: string;
  price: number;
  image: string;
}

function daysAgoTimestamp(days: number): admin.firestore.Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10 + (days % 8), (days * 7) % 60, 0, 0);
  return admin.firestore.Timestamp.fromDate(date);
}

function buildOrderTimeline(
  status: OrderStatus,
  createdAt: admin.firestore.Timestamp
): { status: string; message: string; timestamp: admin.firestore.Timestamp }[] {
  const ms = createdAt.toMillis();
  const day = 24 * 60 * 60 * 1000;
  const event = (
    s: string,
    message: string,
    offsetDays: number
  ) => ({
    status: s,
    message,
    timestamp: admin.firestore.Timestamp.fromMillis(
      ms + offsetDays * day
    ),
  });

  const base = [event("confirmed", "Payment received", 0)];

  switch (status) {
    case "pending":
      return [event("pending", "Awaiting payment confirmation", 0)];
    case "confirmed":
      return base;
    case "processing":
      return [...base, event("processing", "Order is being prepared", 1)];
    case "shipped":
      return [
        ...base,
        event("processing", "Order is being prepared", 1),
        event("shipped", "Package dispatched", 2),
      ];
    case "delivered":
      return [
        ...base,
        event("processing", "Order is being prepared", 1),
        event("shipped", "Package dispatched", 2),
        event("delivered", "Delivered successfully", 5),
      ];
    case "cancelled":
      return [
        event("confirmed", "Payment received", 0),
        event("cancelled", "Order cancelled", 1),
      ];
    default:
      return base;
  }
}

function calcOrderTotals(
  items: { price: number; quantity: number }[]
): { subtotal: number; shipping: number; tax: number; total: number } {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = items.length > 0 ? SHIPPING_FEE : 0;
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}

async function deleteAuthUserByEmail(email: string): Promise<void> {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
  } catch {
    // User may not exist in Auth
  }
}

async function createAuthUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  try {
    const user = await auth.createUser({ email, password, displayName });
    return user.uid;
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === "auth/email-already-exists") {
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, displayName });
      return user.uid;
    }
    throw err;
  }
}

async function deleteCollection(name: string): Promise<number> {
  const col = db.collection(name);
  let total = 0;
  while (true) {
    const snapshot = await col.limit(BATCH_SIZE).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    total += snapshot.size;
  }
  return total;
}

async function flushDatabase(): Promise<void> {
  console.log("Flushing Firestore data...\n");

  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@example.com";
  console.log("Removing seed Auth users...");
  for (const email of [...customerSeed.map((c) => c.email), adminEmail]) {
    await deleteAuthUserByEmail(email);
  }
  console.log("  ✓ Seed Auth users cleared\n");

  const usersSnap = await db.collection("users").get();
  let wishlistCount = 0;
  for (const userDoc of usersSnap.docs) {
    const wishlist = await userDoc.ref.collection("wishlist").get();
    if (!wishlist.empty) {
      const batch = db.batch();
      wishlist.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      wishlistCount += wishlist.size;
    }
  }
  if (wishlistCount > 0) console.log(`  ✓ Deleted ${wishlistCount} wishlist items`);

  const collections = ["products", "categories", "orders", "reviews", "users"];
  for (const name of collections) {
    const count = await deleteCollection(name);
    console.log(`  ✓ Deleted ${count} documents from /${name}`);
  }

  console.log("");
}

async function downloadImage(
  url: string,
  dest: string,
  fallbackSeed?: string
): Promise<boolean> {
  const tryFetch = async (fetchUrl: string) => {
    const res = await fetch(fetchUrl, { redirect: "follow" });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.length >= 1000 ? buffer : null;
  };

  try {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    let buffer = await tryFetch(url);
    if (!buffer && fallbackSeed) {
      buffer = await tryFetch(
        `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed)}/800/800`
      );
    }
    if (!buffer) return false;
    await fs.writeFile(dest, buffer);
    return true;
  } catch {
    return false;
  }
}

async function ensureDefaultImages() {
  const defaultsDir = path.join(UPLOAD_ROOT, "defaults");
  await fs.mkdir(defaultsDir, { recursive: true });

  const files = [
    {
      name: "product.jpg",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    },
    {
      name: "category.jpg",
      url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
    },
  ];

  for (const { name, url } of files) {
    const dest = path.join(defaultsDir, name);
    try {
      await fs.access(dest);
    } catch {
      console.log(`  Downloading default ${name}...`);
      await downloadImage(url, dest);
    }
  }
}

async function downloadCatalogImages() {
  console.log("Downloading product & category images...\n");

  const categoryImages: Record<string, string> = {};
  for (const cat of categorySeed) {
    const dest = path.join(UPLOAD_ROOT, "seed", "categories", `${cat.id}.jpg`);
    const ok = await downloadImage(cat.imageUrl, dest, cat.id);
    categoryImages[cat.id] = ok
      ? `/uploads/seed/categories/${cat.id}.jpg`
      : "/uploads/defaults/category.jpg";
    console.log(`  ${ok ? "✓" : "⚠"} ${cat.name}`);
  }

  const productImages: Record<string, string> = {};
  for (const product of productSeed) {
    const dest = path.join(UPLOAD_ROOT, "seed", "products", `${product.slug}.jpg`);
    const ok = await downloadImage(product.imageUrl, dest, product.slug);
    productImages[product.slug] = ok
      ? `/uploads/seed/products/${product.slug}.jpg`
      : "/uploads/defaults/product.jpg";
    console.log(`  ${ok ? "✓" : "⚠"} ${product.name}`);
  }

  console.log("\nDownloading banner images...\n");
  for (const banner of bannerSeed) {
    const dest = path.join(UPLOAD_ROOT, "seed", "banners", `${banner.id}.jpg`);
    const ok = await downloadImage(banner.imageUrl, dest, banner.id);
    console.log(`  ${ok ? "✓" : "⚠"} banner ${banner.id}`);
  }

  return { categoryImages, productImages };
}

async function seed() {
  if (!process.argv.includes("--no-flush")) {
    await flushDatabase();
  }

  await ensureDefaultImages();
  const { categoryImages, productImages } = await downloadCatalogImages();

  console.log("\nSeeding categories...");
  for (const cat of categorySeed) {
    await db.collection("categories").doc(cat.id).set({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: categoryImages[cat.id],
    });
    console.log(`  ✓ ${cat.name}`);
  }

  console.log("Seeding products...");
  const productCatalog: Record<string, ProductCatalogEntry> = {};
  for (const product of productSeed) {
    const { imageUrl: _img, ...data } = product;
    const ref = db.collection("products").doc();
    const image = productImages[product.slug];
    await ref.set({
      ...data,
      images: [image],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    productCatalog[product.slug] = {
      id: ref.id,
      name: product.name,
      price: product.price,
      image,
    };
    console.log(`  ✓ ${product.name}`);
  }

  console.log("\nSeeding customers...");
  const customerUids: string[] = [];
  for (const customer of customerSeed) {
    const uid = await createAuthUser(
      customer.email,
      SEED_CUSTOMER_PASSWORD,
      customer.displayName
    );
    customerUids.push(uid);

    const address = {
      id: `addr-${customer.email.split("@")[0]}`,
      fullName: customer.displayName,
      phone: customer.phone,
      line1: `42 ${customer.city} Main Road`,
      line2: "Near City Mall",
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      isDefault: true,
    };

    await db.collection("users").doc(uid).set({
      uid,
      email: customer.email,
      displayName: customer.displayName,
      role: "customer",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addresses: [address],
    });
    console.log(`  ✓ ${customer.displayName} (${customer.email})`);
  }

  console.log("\nSeeding orders...");
  let orderCount = 0;
  for (const order of orderSeed) {
    const customer = customerSeed[order.customerIndex];
    const userId = customerUids[order.customerIndex];
    if (!customer || !userId) continue;

    const orderItems = order.items
      .map((item) => {
        const product = productCatalog[item.productSlug];
        if (!product) {
          console.warn(`  ⚠ Unknown product slug: ${item.productSlug}`);
          return null;
        }
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: item.quantity,
        };
      })
      .filter(Boolean) as {
      productId: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }[];

    if (orderItems.length === 0) continue;

    const totals = calcOrderTotals(orderItems);
    const createdAt = daysAgoTimestamp(order.daysAgo);
    const updatedAt = daysAgoTimestamp(Math.max(0, order.daysAgo - 1));
    const address = {
      id: `addr-${customer.email.split("@")[0]}`,
      fullName: customer.displayName,
      phone: customer.phone,
      line1: `42 ${customer.city} Main Road`,
      line2: "Near City Mall",
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      isDefault: true,
    };

    const orderRef = db.collection("orders").doc();
    await orderRef.set({
      userId,
      items: orderItems,
      shippingAddress: address,
      ...totals,
      status: order.status,
      stripeSessionId: `cs_seed_${orderRef.id}`,
      stripePaymentIntentId: `pi_seed_${orderRef.id}`,
      ...(order.trackingNumber ? { trackingNumber: order.trackingNumber } : {}),
      timeline: buildOrderTimeline(order.status, createdAt),
      createdAt,
      updatedAt,
    });
    orderCount++;
  }
  console.log(`  ✓ ${orderCount} orders`);

  console.log("Seeding reviews...");
  let reviewCount = 0;
  for (const review of reviewSeed) {
    const userId = customerUids[review.customerIndex];
    const product = productCatalog[review.productSlug];
    if (!userId || !product) {
      console.warn(`  ⚠ Skipped review for ${review.productSlug}`);
      continue;
    }
    const reviewRef = db.collection("reviews").doc();
    await reviewRef.set({
      userId,
      productId: product.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verified: review.verified,
      createdAt: daysAgoTimestamp(review.daysAgo),
    });
    reviewCount++;
  }
  console.log(`  ✓ ${reviewCount} reviews`);

  console.log("Seeding wishlists...");
  let wishlistCount = 0;
  for (const entry of wishlistSeed) {
    const userId = customerUids[entry.customerIndex];
    if (!userId) continue;
    for (const slug of entry.productSlugs) {
      const product = productCatalog[slug];
      if (!product) continue;
      await db
        .collection("users")
        .doc(userId)
        .collection("wishlist")
        .doc(product.id)
        .set({
          productId: product.id,
          addedAt: daysAgoTimestamp(Math.floor(Math.random() * 14) + 1),
        });
      wishlistCount++;
    }
  }
  console.log(`  ✓ ${wishlistCount} wishlist items`);

  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Admin@123456";

  console.log(`\nCreating admin user: ${adminEmail}`);
  let uid: string;
  try {
    const user = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Admin",
    });
    uid = user.uid;
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === "auth/email-already-exists") {
      const user = await auth.getUserByEmail(adminEmail);
      uid = user.uid;
      console.log("  Admin user already exists, updating Firestore doc...");
    } else {
      throw err;
    }
  }

  await db.collection("users").doc(uid).set(
    {
      uid,
      email: adminEmail,
      displayName: "Admin",
      role: "admin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      addresses: [],
    },
    { merge: true }
  );

  console.log("\n✅ Seed completed successfully!");
  console.log(
    `   ${categorySeed.length} categories, ${productSeed.length} products`
  );
  console.log(
    `   ${customerSeed.length} customers, ${orderCount} orders, ${reviewCount} reviews, ${wishlistCount} wishlist items`
  );
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log(
    `Customer login (any): ${customerSeed[0]!.email} / ${SEED_CUSTOMER_PASSWORD}`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
