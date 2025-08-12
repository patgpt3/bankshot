import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";
export const CONNECTION = new Connection(process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl(CLUSTER), "confirmed");
export const PROGRAM_ID = new PublicKey((process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111"));
export const USDC_MINT = new PublicKey((process.env.NEXT_PUBLIC_USDC_MINT ?? "So11111111111111111111111111111111111111112"));
export const TREASURY = new PublicKey((process.env.NEXT_PUBLIC_TREASURY ?? "11111111111111111111111111111111"));
