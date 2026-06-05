import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import {
  saveLocalImage,
  UPLOAD_FOLDERS,
  type UploadFolder,
} from "@/lib/local-storage";

async function requireAdmin(sessionCookie: string | undefined) {
  if (!sessionCookie) return null;
  const decoded = await getAdminAuth().verifyIdToken(sessionCookie);
  const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data()?.role !== "admin") return null;
  return decoded;
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    const admin = await requireAdmin(sessionCookie);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;
    const entityId = formData.get("entityId") as string | null;

    if (!file || !folder || !entityId) {
      return NextResponse.json(
        { error: "file, folder, and entityId are required" },
        { status: 400 }
      );
    }

    if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveLocalImage(
      buffer,
      folder as UploadFolder,
      entityId,
      file.name,
      file.type || "image/jpeg"
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Local upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
