import Stripe from "stripe";
import prisma from "@/src/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-12-18.acacia" as any });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    if (!sig) throw new Error("Missing stripe-signature");
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const cartId = session.metadata?.cartId as string | undefined;
    const amountCents = session.amount_total ?? 0;
    const currency = session.currency?.toUpperCase() ?? "USD";

    if (cartId) {
      await prisma.order.upsert({
        where: { cartId },
        create: {
          cartId,
          email: session.customer_details?.email || "",
          amountCents,
          currency,
          stripeId: session.id,
          status: "paid",
        },
        update: { status: "paid" },
      });
      await prisma.cart.update({ where: { id: cartId }, data: { completed: true } });
    }
  }

  return NextResponse.json({ received: true });
}


