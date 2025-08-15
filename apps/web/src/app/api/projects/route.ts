import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, slug, subtitle, description, priceCents, currency, supplyCap, treasury, template, images } = body || {};
    if (!title || !slug) return NextResponse.json({ error: "Missing title or slug" }, { status: 400 });
    const created = await prisma.project.create({
      data: { title, slug, subtitle, description, priceCents, currency, supplyCap, treasury, template, images: images?.length ? { create: images.map((url: string, idx: number) => ({ url, position: idx })) } : undefined }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
