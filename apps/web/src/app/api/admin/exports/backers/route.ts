import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) return new Response("missing projectId", { status: 400 });
  const orders = await prisma.order.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
  const rows = ["email,amount,currency,createdAt,tierId,referralCode", ...orders.map(o => `${o.email},${(o.amountCents/100).toFixed(2)},${o.currency},${o.createdAt.toISOString()},${o.tierId ?? ''},${o.referralCode ?? ''}`)];
  return new Response(rows.join("\n"), { headers: { "Content-Type": "text/csv" } });
}
