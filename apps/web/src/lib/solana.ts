import { Connection, PublicKey, clusterApiUrl, type Cluster } from "@solana/web3.js";

const clusterEnv = process.env.NEXT_PUBLIC_CLUSTER as Cluster | undefined;
export const CLUSTER: Cluster = clusterEnv ?? "devnet";
export const CONNECTION = new Connection(
  process.env.NEXT_PUBLIC_RPC || clusterApiUrl(CLUSTER),
  "confirmed"
);

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "11111111111111111111111111111111"
);

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const TREASURY = new PublicKey(
  process.env.NEXT_PUBLIC_TREASURY || "11111111111111111111111111111111"
);