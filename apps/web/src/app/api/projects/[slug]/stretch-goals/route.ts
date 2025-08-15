import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { stretchGoals: { orderBy: { amountCents: "asc" } } } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project.stretchGoals);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json();
  const { title, amountCents } = body || {};
  const project = await prisma.project.findUnique({ where: { slug: params.slug } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!title || amountCents == null) return NextResponse.json({ error: "Missing title/amount" }, { status: 400 });
  const sg = await prisma.stretchGoal.create({ data: { projectId: project.id, title, amountCents } });
  return NextResponse.json(sg, { status: 201 });
}
