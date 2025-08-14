import prisma from "@/lib/prisma";

export async function getCartById(cartId: string) {
  if (!cartId) return null;
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
}

export function computeCartSubtotalMinor(cart: { items: { quantity: number; variant: { priceCents: number } }[] } | null) {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity * item.variant.priceCents, 0);
}


