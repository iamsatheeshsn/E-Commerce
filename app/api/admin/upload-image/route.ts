import { NextRequest, NextResponse } from "next/server";

/** @deprecated Use POST /api/upload instead */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const productId = formData.get("productId");

  if (file && productId) {
    const body = new FormData();
    body.append("file", file);
    body.append("folder", "products");
    body.append("entityId", String(productId));

    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/upload`, {
      method: "POST",
      body,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ error: "file and productId required" }, { status: 400 });
}
