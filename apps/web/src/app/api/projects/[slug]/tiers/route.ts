import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { tiers: { orderBy: { priceCents: "asc" } } } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project.tiers);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json();
  const { name, description, priceCents, maxQty, shipEta } = body || {};
  const project = await prisma.project.findUnique({ where: { slug: params.slug } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!name || priceCents == null) return NextResponse.json({ error: "Missing name/price" }, { status: 400 });
  const tier = await prisma.tier.create({ data: { projectId: project.id, name, description, priceCents, maxQty, shipEta } });
  return NextResponse.json(tier, { status: 201 });
}
