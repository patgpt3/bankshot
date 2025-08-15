"use client";
import { useEffect, useState } from "react";

export default function PromoInput({ projectSlug }: { projectSlug: string }) {
  const [code, setCode] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(`promo:${projectSlug}`);
    if (existing) setCode(existing);
  }, [projectSlug]);
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Promo code" style={{ padding: 8, border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8 }} />
      <button type="button" onClick={()=>{ localStorage.setItem(`promo:${projectSlug}`, code || ""); }} style={{ padding: '8px 12px' }}>Apply</button>
    </div>
  );
}
