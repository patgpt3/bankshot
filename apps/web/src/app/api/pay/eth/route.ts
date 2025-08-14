import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { amount, to } = await req.json();
  if (!amount || !to) return NextResponse.json({ error: "missing params" }, { status: 400 });
  // Return basic payment request metadata for client-side EIP-1559 transfer
  return NextResponse.json({
    chainId: process.env.NEXT_PUBLIC_ETH_CHAIN_ID || 1,
    to,
    value: amount,
    data: "0x",
  });
}


