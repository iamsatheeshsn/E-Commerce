import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { createCheckoutSession } from "@/lib/stripe";
import { CartItem } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(sessionCookie);
    const body = await request.json();
    const { items, addressId, couponDiscount = 0 } = body as {
      items: CartItem[];
      addressId: string;
      couponDiscount?: number;
    };

    if (!items?.length || !addressId) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = getAdminDb();
    for (const item of items) {
      const productDoc = await db.collection("products").doc(item.productId).get();
      if (!productDoc.exists) {
        return NextResponse.json(
          { error: `Product ${item.name} not found` },
          { status: 400 }
        );
      }
      const stock = productDoc.data()!.stock as number;
      if (stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name}` },
          { status: 400 }
        );
      }
    }

    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const userEmail = userDoc.data()?.email || decoded.email || "";

    const { session } = await createCheckoutSession({
      items,
      userId: decoded.uid,
      addressId,
      userEmail,
      couponDiscount,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
