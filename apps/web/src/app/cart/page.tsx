import prisma from "@/src/lib/prisma";
import { cookies } from "next/headers";

export default async function CartPage() {
  const cartId = cookies().get("cartId")?.value || "";
  const cart = cartId
    ? await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { variant: { include: { product: true } } } } },
      })
    : null;

  const subtotal = cart?.items.reduce((sum, item) => sum + item.quantity * item.variant.priceCents, 0) ?? 0;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Your Cart</h1>
      {!cart || cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {cart.items.map((item) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{item.variant.product.name} — {item.variant.title}</div>
                <div style={{ opacity: 0.7 }}>Qty {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 600 }}>${((item.variant.priceCents * item.quantity)/100).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 700 }}>
            <span>Subtotal</span>
            <span>${(subtotal/100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <form action="/api/checkout" method="post">
              <button type="submit" style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.2)", background: "#111827", color: "#fff" }}>Checkout (Card)</button>
            </form>
            <a href="/cart/pay-with-wallet" style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.2)", textDecoration: "none" }}>Pay with Wallet (ETH / SOL)</a>
          </div>
        </div>
      )}
    </main>
  );
}


