import fs from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const UPLOAD_FOLDERS = ["products", "categories", "users"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export function getDefaultImagePath(folder: UploadFolder): string {
  return `/uploads/defaults/${folder}.jpg`;
}

export async function saveLocalImage(
  buffer: Buffer,
  folder: UploadFolder,
  entityId: string,
  originalName: string,
  contentType: string
): Promise<string> {
  if (!ALLOWED_MIME.has(contentType)) {
    throw new Error("Only JPG, PNG, WebP, and GIF images are allowed");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be smaller than 5MB");
  }
  if (!entityId || /[./\\]/.test(entityId)) {
    throw new Error("Invalid entity id");
  }

  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const safeBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);
  const filename = `${Date.now()}-${safeBase}${ext}`;
  const dir = path.join(UPLOAD_ROOT, folder, entityId);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);

  return `/uploads/${folder}/${entityId}/${filename}`;
}

export async function deleteLocalImage(publicPath: string): Promise<void> {
  if (!publicPath.startsWith("/uploads/")) return;
  const fullPath = path.join(process.cwd(), "public", publicPath.replace(/\//g, path.sep));
  await fs.unlink(fullPath).catch(() => {});
}

/** Turn `/uploads/...` into absolute URL for Stripe / external APIs */
export function toAbsoluteImageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}
