import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Uploads not configured. Choose S3, Cloudflare R2, or Supabase and add keys." }, { status: 501 });
}
