export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { images: { orderBy: { position: "asc" } } } });
  if (!project) return notFound();
  const hero = project.images[0]?.url ?? "";
  return (
    <main style={{ padding: 24 }}>
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, marginBottom: 8 }}>{project.title}</h1>
          {project.subtitle && <p style={{ opacity: 0.8, fontSize: 18 }}>{project.subtitle}</p>}
          {project.description && <p style={{ marginTop: 12 }}>{project.description}</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <a href="/cart/pay-with-wallet" style={{ display: "inline-block", background: "#111827", color: "#fff", padding: "12px 16px", borderRadius: 10, textDecoration: "none" }}>
              {project.priceCents != null ? `Preorder  $${(project.priceCents/100).toFixed(2)}` : "Preorder"}
            </a>
          </div>
        </div>
        <div>
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={project.title} style={{ display: "block", width: "100%", height: "auto", borderRadius: 12 }} />
          )}
        </div>
      </section>
    </main>
  );
}
