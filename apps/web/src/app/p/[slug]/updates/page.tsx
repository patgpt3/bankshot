export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProjectUpdates({ params }: { params: { slug: string } }){
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { updates: { orderBy: { publishedAt: "desc" } } } });
  if (!project) return notFound();
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>{project.title}  Updates</h1>
      <div style={{ display: 'grid', gap: 16 }}>
        {project.updates.map(u => (
          <article key={u.id} style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: 14 }}>
            <div style={{ fontWeight: 600 }}>{u.title}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>{new Date(u.publishedAt as any).toLocaleString()}</div>
            <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{u.body}</div>
          </article>
        ))}
      </div>
    </main>
  );
}
