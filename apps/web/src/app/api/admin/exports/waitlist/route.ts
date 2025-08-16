import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return new Response("missing projectId", { status: 400 });
  const subs = await prisma.projectSubscriber.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
  const rows = ["email,createdAt", ...subs.map(s => `${s.email},${s.createdAt.toISOString()}`)];
  return new Response(rows.join("\n"), { headers: { "Content-Type": "text/csv" } });
}
