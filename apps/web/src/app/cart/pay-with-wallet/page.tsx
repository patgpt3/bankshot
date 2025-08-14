"use client";
import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { ethers } from "ethers";

export default function PayWithWalletPage() {
  const [amount, setAmount] = useState(0.1);
  const [status, setStatus] = useState<string | null>(null);
  const { publicKey, signTransaction } = useWallet();
  const endpoint = process.env.NEXT_PUBLIC_RPC || "https://api.devnet.solana.com";
  const connection = useMemo(() => new Connection(endpoint), [endpoint]);

  const paySol = useCallback(async () => {
    if (!publicKey || !signTransaction) { setStatus("Connect a Solana wallet"); return; }
    try {
      setStatus("Preparing transaction...");
      const treasury = new PublicKey(process.env.NEXT_PUBLIC_TREASURY || "So11111111111111111111111111111111111111112");
      const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: treasury, lamports: Math.round(amount * LAMPORTS_PER_SOL) }));
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      const verify = await fetch("/api/verify/solana", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signature: sig, expectedAmount: amount }) }).then(r => r.json());
      if (verify.verified) {
        setStatus(`Solana payment verified: ${sig}`);
        window.location.href = "/checkout/success";
      } else {
        setStatus(`SOL verification failed: ${verify.reason || "unknown"}`);
      }
    } catch (e: any) {
      setStatus(`SOL error: ${e.message}`);
    }
  }, [publicKey, signTransaction, amount, connection]);

  const payEth = useCallback(async () => {
    try {
      setStatus("Requesting wallet...");
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const to = process.env.NEXT_PUBLIC_ETH_TREASURY as string;
      const tx = await signer.sendTransaction({ to, value: ethers.parseEther(String(amount)) });
      await tx.wait();
      const verify = await fetch("/api/verify/eth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txHash: tx.hash, expectedAmount: amount }) }).then(r => r.json());
      if (verify.verified) {
        setStatus(`ETH payment verified: ${tx.hash}`);
        window.location.href = "/checkout/success";
      } else {
        setStatus(`ETH verification failed: ${verify.reason || "unknown"}`);
      }
    } catch (e: any) {
      setStatus(`ETH error: ${e.message}`);
    }
  }, [amount]);

  return (
    <main style={{ padding: 24, display: "grid", gap: 12 }}>
      <h1 style={{ fontSize: 24 }}>Pay with Wallet</h1>
      <label>
        Amount
        <input value={amount} onChange={(e) => setAmount(parseFloat(e.target.value || "0"))} type="number" min="0" step="0.01" style={{ marginLeft: 8 }} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={paySol} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.2)" }}>Pay SOL</button>
        <button onClick={payEth} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.2)" }}>Pay ETH</button>
      </div>
      {status && <div style={{ opacity: 0.8 }}>{status}</div>}
    </main>
  );
}


