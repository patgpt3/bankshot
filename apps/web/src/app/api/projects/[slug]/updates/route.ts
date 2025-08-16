import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({ where: { slug: params.slug }, include: { updates: { orderBy: { publishedAt: "desc" } } } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project.updates);
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const body = await req.json();
  const { title, body: content } = body || {};
  const project = await prisma.project.findUnique({ where: { slug: params.slug } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!title || !content) return NextResponse.json({ error: "Missing title/body" }, { status: 400 });
  const update = await prisma.projectUpdate.create({ data: { projectId: project.id, title, body: content } });
  return NextResponse.json(update, { status: 201 });
}
