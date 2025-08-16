import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { projectId, code } = await req.json();
  if (!projectId || !code) return NextResponse.json({ error: "Missing" }, { status: 400 });
  const updated = await prisma.referral.upsert({ where: { projectId_code: { projectId, code } }, update: { clicks: { increment: 1 } }, create: { projectId, code, clicks: 1 } });
  return NextResponse.json(updated);
}
