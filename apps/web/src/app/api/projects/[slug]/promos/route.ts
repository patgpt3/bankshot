import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { promoCodes: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project.promoCodes);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json();
  const { code, percentOff, amountOff, maxUses } = body || {};
  const project = await prisma.project.findUnique({ where: { slug: params.slug } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  const promo = await prisma.promoCode.create({ data: { projectId: project.id, code, percentOff, amountOff, maxUses } });
  return NextResponse.json(promo, { status: 201 });
}
