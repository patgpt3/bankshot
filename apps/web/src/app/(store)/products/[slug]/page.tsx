export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { variants: true, images: { orderBy: { position: "asc" } } },
  });
  if (!product) return notFound();

  const image = product.images[0]?.url ?? "";

  return (
    <main style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} style={{ display: "block", width: "100%", height: "auto", borderRadius: 12 }} />
        )}
      </div>
      <div>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>{product.name}</h1>
        {product.description && <p style={{ opacity: 0.8 }}>{product.description}</p>}
        <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
          {product.variants.map(v => (
            <form key={v.id} action={`/api/cart/add`} method="post" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="hidden" name="variantId" value={v.id} />
              <span>{v.title}</span>
              <span style={{ fontWeight: 600 }}>${(v.priceCents/100).toFixed(2)}</span>
              <button type="submit" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.2)", background: "#111827", color: "#fff" }}>Add to cart</button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}




