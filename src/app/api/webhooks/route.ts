import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function timingSafeEqualText(a: string, b: string) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || "";
  if (!secret) {
    return NextResponse.json(
      { error: "SHOPIFY_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const receivedHmac = request.headers.get("x-shopify-hmac-sha256") || "";

  if (!receivedHmac) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
  }

  const computedHmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  if (!timingSafeEqualText(computedHmac, receivedHmac)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") || "unknown";
  const shopDomain = request.headers.get("x-shopify-shop-domain") || "unknown";

  // TODO: Handle topic-specific logic here.
  console.log("[shopify-webhook] verified", { topic, shopDomain });

  return NextResponse.json({ ok: true });
}
