"use client";
import { useState } from "react";

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number | "">("");
  const [supplyCap, setSupplyCap] = useState<number | "">("");
  const [treasury, setTreasury] = useState("");
  const [imagesCsv, setImagesCsv] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const images = imagesCsv.split(",").map(s=>s.trim()).filter(Boolean);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, subtitle, description, priceCents: priceCents===""?null:Number(priceCents), supplyCap: supplyCap===""?null:Number(supplyCap), treasury, images })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Created. View at /p/" + data.slug);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding: 24, display: "grid", gap: 16, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28 }}>Create Project</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required style={{ marginLeft: 8 }} /></label>
        <label>Slug<input value={slug} onChange={e=>setSlug(e.target.value)} required style={{ marginLeft: 8 }} /></label>
        <label>Subtitle<input value={subtitle} onChange={e=>setSubtitle(e.target.value)} style={{ marginLeft: 8 }} /></label>
        <label>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} style={{ marginLeft: 8, width: "100%", minHeight: 100 }} /></label>
        <label>Price (cents)<input value={priceCents} onChange={e=>setPriceCents(e.target.value===""?"":Number(e.target.value))} type="number" min="0" step="1" style={{ marginLeft: 8 }} /></label>
        <label>Supply Cap<input value={supplyCap} onChange={e=>setSupplyCap(e.target.value===""?"":Number(e.target.value))} type="number" min="0" step="1" style={{ marginLeft: 8 }} /></label>
        <label>Treasury Pubkey<input value={treasury} onChange={e=>setTreasury(e.target.value)} style={{ marginLeft: 8 }} /></label>
        <label>Image URLs (comma separated)<textarea value={imagesCsv} onChange={e=>setImagesCsv(e.target.value)} style={{ marginLeft: 8, width: "100%", minHeight: 80 }} /></label>
        <button disabled={saving} type="submit" style={{ width: 200, padding: "10px 14px" }}>{saving?"Saving...":"Create Project"}</button>
      </form>
      {msg && <div>{msg}</div>}
    </main>
  );
}
