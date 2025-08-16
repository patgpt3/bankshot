import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    const updated = await prisma.project.update({ where: { slug }, data: { published: true } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
