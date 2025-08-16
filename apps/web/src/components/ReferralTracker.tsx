"use client";
import { useEffect } from "react";

export default function ReferralTracker({ projectId }: { projectId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const code = url.searchParams.get("ref");
    if (!code) return;
    fetch("/api/referrals/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, code }) }).catch(() => {});
  }, [projectId]);
  return null;
}
