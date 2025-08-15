export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import PublishButton from "./PublishButton";

export default async function AdminProjects(){
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Projects</h1>
      <div style={{ display: "grid", gap: 8 }}>
        {projects.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.1)", padding: 12, borderRadius: 8 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.title} <span style={{ opacity: 0.6 }}>/p/{p.slug}</span></div>
              <div style={{ opacity: 0.7 }}>Published: {String(p.published)}</div>
            </div>
            {!p.published && <PublishButton id={p.id} />}
          </div>
        ))}
      </div>
    </main>
  );
}
