import type { UploadFolder } from "@/lib/local-storage";

/**
 * Upload an image to the local server (public/uploads).
 * Files are served statically at /uploads/{folder}/{entityId}/{filename}
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
  entityId: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("entityId", entityId);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to upload image");
  }
  return data.url as string;
}

/** @deprecated Use uploadImage(file, 'products', productId) */
export async function uploadProductImageClient(
  file: File,
  productId: string
): Promise<string> {
  return uploadImage(file, "products", productId);
}
