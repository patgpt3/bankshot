export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import prisma from "@/lib/prisma";
import ProjectPageView from "@/components/ProjectPage";\nimport PromoInput from "@/components/PromoInput";
import ReferralTracker from "@/components/ReferralTracker";
import { notFound } from "next/navigation";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { images: { orderBy: { position: "asc" } }, tiers: { orderBy: { priceCents: "asc" } } } });
  if (!project) return notFound();
  return (
    <main style={{ padding: 24 }}>
      <ReferralTracker projectId={project.id} />
      <ProjectPageView project={project as any} />
      {project.goalCents && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Funding progress</div>
          <div style={{ height: 10, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, Math.round((project.pledgedCents / project.goalCents) * 100))}%`, height: 10, background: "#22c55e" }} />
          </div>
          <div style={{ marginTop: 6, opacity: 0.8 }}>
            ${'${'}(project.pledgedCents/100).toFixed(2){'}'} raised  {project.backersCount} backers  goal ${'${'}(project.goalCents/100).toFixed(2){'}'}
          </div>
        </div>
      )}
      {project.tiers.length > 0 && (
        <section style={{ marginTop: 28, display: "grid", gap: 12 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>Reward tiers</h2>
          {project.tiers.map(t => (
            <div key={t.id} style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                {t.description && <div style={{ opacity: 0.8 }}>{t.description}</div>}
                <div style={{ opacity: 0.8, marginTop: 4 }}>{t.shipEta ? `Est. ship ${'${'}t.shipEta{'}'}` : ""}</div>
              </div>
              <a href={`/cart/pay-with-wallet?tierId=${'${'}t.id{'}'}`} style={{ display: "inline-block", background: "#111827", color: "#fff", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
                ${'${'}(t.priceCents/100).toFixed(2){'}'}
              </a>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}


