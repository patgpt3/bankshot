"use client";
import React, { type ReactElement } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Header(): ReactElement | null {
  const { ready, authenticated, login, logout } = usePrivy();
  if (!ready) return null;

  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
      <button
        onClick={authenticated ? logout : login}
        style={{
          background: "#005193",
          color: "#f0e9e3",
          border: "none",
          borderRadius: 10,
          padding: "10px 14px",
          cursor: "pointer",
        }}
      >
        {authenticated ? "Logout" : "Connect"}
      </button>
    </div>
  );
}


