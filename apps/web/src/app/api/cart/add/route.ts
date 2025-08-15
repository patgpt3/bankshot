import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const form = await req.formData();
  const variantId = String(form.get("variantId") || "");
  if (!variantId) return NextResponse.json({ error: "Missing variantId" }, { status: 400 });

  let cartId = cookies().get("cartId")?.value;
  if (!cartId) {
    const cart = await prisma.cart.create({ data: {} });
    cartId = cart.id;
    cookies().set("cartId", cartId, { path: "/", httpOnly: false, sameSite: "lax" });
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } as any },
    create: { cartId, variantId, quantity: 1 },
    update: { quantity: { increment: 1 } },
  } as any);

  return NextResponse.redirect(new URL("/cart", req.url));
}



