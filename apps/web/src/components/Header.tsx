"use client";
import React, { type ReactElement } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

export default function Header(): ReactElement | null {
  const { ready, authenticated, login, logout } = usePrivy();
  if (!ready) return null;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#F4EFE9",
        backdropFilter: "saturate(180%) blur(8px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "#0a0a0a",
            textDecoration: "none",
          }}
        >
          Bankshot
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/products" style={{ textDecoration: "none", color: "#0a0a0a" }}>
            Products
          </Link>
          <Link href="/cart" style={{ textDecoration: "none", color: "#0a0a0a" }}>
            Cart
          </Link>
          <button
            onClick={authenticated ? logout : login}
            style={{
              background: "#22c55e",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
            }}
          >
            {authenticated ? "Logout" : "Connect"}
          </button>
        </div>
      </nav>
    </header>
  );
}
