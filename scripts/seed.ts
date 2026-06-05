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
  for (const product of productSeed) {
    const { imageUrl: _img, ...data } = product;
    const ref = db.collection("products").doc();
    await ref.set({
      ...data,
      images: [productImages[product.slug]],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  ✓ ${product.name}`);
  }

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
  console.log(`   ${categorySeed.length} categories, ${productSeed.length} products`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
