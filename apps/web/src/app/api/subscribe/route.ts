import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { projectId, email } = await req.json();
    if (!projectId || !email) return NextResponse.json({ error: "Missing projectId/email" }, { status: 400 });
    const created = await prisma.projectSubscriber.upsert({
      where: { projectId_email: { projectId, email } },
      update: {},
      create: { projectId, email }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
