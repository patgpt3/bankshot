"use client";
import { useState } from "react";

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [priceCents, setPriceCents] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, priceCents: priceCents === "" ? null : Number(priceCents) })
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
    <main style={{ padding: 24, display: "grid", gap: 16, maxWidth: 680 }}>
      <h1 style={{ fontSize: 28 }}>Create Project</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required style={{ marginLeft: 8 }} /></label>
        <label>Slug<input value={slug} onChange={e=>setSlug(e.target.value)} required style={{ marginLeft: 8 }} /></label>
        <label>Price (cents)
          <input value={priceCents} onChange={e=>setPriceCents(e.target.value === "" ? "" : Number(e.target.value))} type="number" min="0" step="1" style={{ marginLeft: 8 }} />
        </label>
        <button disabled={saving} type="submit" style={{ width: 160, padding: "8px 12px" }}>{saving?"Saving...":"Create"}</button>
      </form>
      {msg && <div>{msg}</div>}
    </main>
  );
}
