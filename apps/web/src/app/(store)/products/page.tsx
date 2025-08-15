import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { variants: true, images: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>Products</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {products.map((p) => {
          const image = p.images[0]?.url ?? "";
          const minPrice = Math.min(...p.variants.map(v => v.priceCents));
          return (
            <Link key={p.id} href={`/products/${p.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, overflow: "hidden" }}>
              {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={p.name} style={{ display: "block", width: "100%", height: 180, objectFit: "cover" }} />
              )}
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ opacity: 0.7 }}>${(minPrice/100).toFixed(2)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}



