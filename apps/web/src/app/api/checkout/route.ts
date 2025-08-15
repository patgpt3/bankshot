import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-12-18.acacia" as any });

export async function POST(req: Request) {
  const cartId = cookies().get("cartId")?.value || "";
  if (!cartId) return NextResponse.json({ error: "No cart" }, { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!cart || cart.items.length === 0) return NextResponse.json({ error: "Empty cart" }, { status: 400 });

  const line_items = cart.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: item.variant.currency.toLowerCase(),
      product_data: { name: `${item.variant.product.name} — ${item.variant.title}` },
      unit_amount: item.variant.priceCents,
    },
  }));

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    metadata: { cartId },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}



