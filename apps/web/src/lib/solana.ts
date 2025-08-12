import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? 'devnet';
export const CONNECTION = new Connection(process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl(CLUSTER), 'confirmed');
export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
export const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);
export const TREASURY = new PublicKey(process.env.NEXT_PUBLIC_TREASURY!);
