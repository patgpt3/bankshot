import { NextResponse } from "next/server";
import { ethers } from "ethers";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { txHash, expectedAmount } = await req.json();
  if (!txHash) return NextResponse.json({ error: "missing txHash" }, { status: 400 });
  const rpc = process.env.NEXT_PUBLIC_ETH_RPC || "https://eth.llamarpc.com";
  const provider = new ethers.JsonRpcProvider(rpc);
  const to = (process.env.NEXT_PUBLIC_ETH_TREASURY || "").toLowerCase();

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1n) return NextResponse.json({ verified: false, reason: "not confirmed" }, { status: 400 });

  const tx = await provider.getTransaction(txHash);
  if (!tx || (tx.to || "").toLowerCase() !== to) return NextResponse.json({ verified: false, reason: "wrong recipient" }, { status: 400 });

  if (expectedAmount) {
    const wei = ethers.parseEther(String(expectedAmount));
    if (tx.value < wei) return NextResponse.json({ verified: false, reason: "insufficient amount" }, { status: 400 });
  }

  const cartId = cookies().get("cartId")?.value;
  if (cartId) {
    await prisma.order.upsert({
      where: { cartId },
      create: {
        cartId,
        email: "wallet@eth", // optional capture via form later
        amountCents: Math.round(Number(expectedAmount || 0) * 100),
        currency: "USD",
        stripeId: `eth_${txHash}`,
        status: "paid",
        paymentRail: "ethereum",
        txId: txHash,
      },
      update: { status: "paid", txId: txHash, paymentRail: "ethereum" },
    });
    await prisma.cart.update({ where: { id: cartId }, data: { completed: true } });
  }
  return NextResponse.json({ verified: true, createdOrder: Boolean(cartId) });
}



