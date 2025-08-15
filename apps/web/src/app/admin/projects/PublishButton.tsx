"use client";
export default function PublishButton({ id }: { id: string }){
  async function publish(){
    const res = await fetch(`/api/projects/${id}`, { method: "PATCH" });
    if (res.ok) location.reload();
  }
  return <button onClick={publish} style={{ padding: "6px 10px" }}>Publish</button>;
}
