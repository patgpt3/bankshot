"use client";
import styles from "./page.module.css";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { listPass, buyPass, createMarket, trade, redeem } from "../lib/actions";

export default function Page() {
  const wallet = useWallet() as any;
  const [mint, setMint] = useState("");
  const [seller, setSeller] = useState("");
  const [price, setPrice] = useState("5");
  const [market, setMarket] = useState("");
  const [amount, setAmount] = useState("5");

  return (
    <main className={styles.main}>
      <div className={styles.center}>
        <h1>Bankshot Launchpad</h1>
      </div>

      <section>
        <h2>Access Pass Marketplace</h2>
        <input placeholder="NFT mint" value={mint} onChange={(e)=>setMint(e.target.value)} />
        <input placeholder="Seller (for buy)" value={seller} onChange={(e)=>setSeller(e.target.value)} />
        <input placeholder="Price (USDC)" value={price} onChange={(e)=>setPrice(e.target.value)} />
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button disabled={!wallet.connected} onClick={async()=>{
            const r = await listPass(wallet, mint, parseFloat(price));
            alert(`Listed: ${r.listing}`);
          }}>List</button>
          <button disabled={!wallet.connected} onClick={async()=>{
            await buyPass(wallet, mint, seller);
            alert('Bought');
          }}>Buy</button>
        </div>
      </section>

      <section>
        <h2>Prediction Market</h2>
        <div style={{display:'flex', gap:8}}>
          <button disabled={!wallet.connected} onClick={async()=>{
            const r = await createMarket(wallet, 50);
            setMarket(r.market);
            alert(`Market: ${r.market}`);
          }}>Create market</button>
          <input placeholder="Market" value={market} onChange={(e)=>setMarket(e.target.value)} />
          <input placeholder="Amount (USDC)" value={amount} onChange={(e)=>setAmount(e.target.value)} />
          <button disabled={!wallet.connected} onClick={async()=>{ await trade(wallet, market, true, parseFloat(amount)); alert('Bought YES'); }}>Buy YES</button>
          <button disabled={!wallet.connected} onClick={async()=>{ await trade(wallet, market, false, parseFloat(amount)); alert('Bought NO'); }}>Buy NO</button>
          <button disabled={!wallet.connected} onClick={async()=>{ await redeem(wallet, market); alert('Redeemed'); }}>Redeem</button>
        </div>
      </section>
    </main>
  );
}
