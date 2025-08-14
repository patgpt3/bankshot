import { NextResponse } from "next/server";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

// Create a Solana Pay-like request payload with recipient and amount.
// The client will sign and send. Server validates and records order separately.
export async function POST(req: Request) {
  const { amount, recipient, reference } = await req.json();
  if (!amount || !recipient) return NextResponse.json({ error: "missing amount/recipient" }, { status: 400 });

  const recipientPk = new PublicKey(recipient);
  const lamports = Math.round(Number(amount) * 1_000_000_000); // 1 SOL = 1e9 lamports

  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: recipientPk, toPubkey: recipientPk, lamports: 0 })
  );
  // Placeholder: we do not prebuild a transfer server-side because the payer (client wallet) is unknown.
  // Instead, return a metadata payload the client can use to construct a transfer to our treasury.

  return NextResponse.json({
    label: "Bankshot MovieCook",
    message: "Pay with wallet",
    amount,
    recipient,
    reference,
  });
}


