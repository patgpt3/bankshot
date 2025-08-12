"use client";
import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import WalletProviders from "../components/WalletProviders";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
  return (
    <PrivyProvider appId={appId} config={{ appearance: { theme: "light" } }}>
      <WalletProviders>{children}</WalletProviders>
    </PrivyProvider>
  );
}