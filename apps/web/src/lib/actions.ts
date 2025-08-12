"use client";
import { AnchorProvider, Program, Idl, web3 } from "@project-serum/anchor";
import { Connection, PublicKey, SystemProgram, clusterApiUrl, type Cluster } from "@solana/web3.js";
import BN from "bn.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export async function getProgram(wallet: any) {
  const rpc = process.env.NEXT_PUBLIC_RPC || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const provider = new AnchorProvider(connection as any, wallet, { commitment: "confirmed" } as any);
  const programIdStr = process.env.NEXT_PUBLIC_PROGRAM_ID || "11111111111111111111111111111111";
  const programId = new PublicKey(programIdStr);
  const idl = (await Program.fetchIdl(programId, provider)) as Idl;
  return new Program(idl, programId, provider);
}

export const pdas = {
  listing(programId: PublicKey, nftMint: PublicKey, seller: PublicKey) {
    return web3.PublicKey.findProgramAddressSync([
      Buffer.from("listing"),
      nftMint.toBuffer(),
      seller.toBuffer(),
    ], programId)[0];
  },
};

const clusterEnv = (process.env.NEXT_PUBLIC_CLUSTER as Cluster | undefined);
export const CLUSTER: Cluster = clusterEnv ?? "devnet";
export const CONNECTION = new Connection(process.env.NEXT_PUBLIC_RPC ?? clusterApiUrl(CLUSTER), "confirmed");
export const PROGRAM_ID = new PublicKey((process.env.NEXT_PUBLIC_PROGRAM_ID ?? "11111111111111111111111111111111"));
export const USDC_MINT = new PublicKey((process.env.NEXT_PUBLIC_USDC_MINT ?? "So11111111111111111111111111111111111111112"));
export const TREASURY = new PublicKey((process.env.NEXT_PUBLIC_TREASURY ?? "11111111111111111111111111111111"));

export async function listPass(wallet: any, nftMintStr: string, priceUsdc: number) {
  const program = await getProgram(wallet);
  const nftMint = new PublicKey(nftMintStr);
  const seller = wallet.publicKey as PublicKey;
  const listing = pdas.listing(program.programId, nftMint, seller);
  const sellerNft = getAssociatedTokenAddressSync(nftMint, seller);
  const escrowNft = getAssociatedTokenAddressSync(nftMint, listing, true);
  await program.methods
    .listPass(new BN(Math.round(priceUsdc * 1_000_000)))
    .accounts({
      seller,
      config: new PublicKey(process.env.NEXT_PUBLIC_CONFIG_PDA!),
      listing,
      nftMint,
      sellerNft,
      escrowNft,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return { listing: listing.toBase58() };
}

export async function buyPass(wallet: any, nftMintStr: string, sellerStr: string) {
  const program = await getProgram(wallet);
  const nftMint = new PublicKey(nftMintStr);
  const seller = new PublicKey(sellerStr);
  const listing = pdas.listing(program.programId, nftMint, seller);
  const buyer = wallet.publicKey as PublicKey;
  const buyerNft = getAssociatedTokenAddressSync(nftMint, buyer);
  const escrowNft = getAssociatedTokenAddressSync(nftMint, listing, true);
  const usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);
  const buyerUsdc = getAssociatedTokenAddressSync(usdcMint, buyer);
  const sellerUsdc = getAssociatedTokenAddressSync(usdcMint, seller);
  const treasuryUsdc = getAssociatedTokenAddressSync(usdcMint, new PublicKey(process.env.NEXT_PUBLIC_TREASURY!));

  await program.methods
    .buyPass()
    .accounts({
      buyer,
      config: new PublicKey(process.env.NEXT_PUBLIC_CONFIG_PDA!),
      listing,
      nftMint,
      escrowNft,
      buyerNft,
      usdcMint,
      buyerUsdc,
      sellerUsdc,
      treasuryUsdc,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function createMarket(wallet: any, feeBps: number) {
  const program = await getProgram(wallet);
  const creator = wallet.publicKey as PublicKey;
  const usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);
  const [market] = PublicKey.findProgramAddressSync([
    Buffer.from("market"),
    creator.toBuffer(),
    usdcMint.toBuffer(),
  ], program.programId);
  const vaultYes = getAssociatedTokenAddressSync(usdcMint, market, true);
  const vaultNo = getAssociatedTokenAddressSync(usdcMint, market, true);
  await program.methods
    .createMarket(feeBps)
    .accounts({
      creator,
      config: new PublicKey(process.env.NEXT_PUBLIC_CONFIG_PDA!),
      usdcMint,
      market,
      vaultYes,
      vaultNo,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  return { market: market.toBase58() };
}

export async function trade(wallet: any, marketStr: string, buyYes: boolean, amountUsdc: number) {
  const program = await getProgram(wallet);
  const trader = wallet.publicKey as PublicKey;
  const market = new PublicKey(marketStr);
  const usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);
  const vaultYes = getAssociatedTokenAddressSync(usdcMint, market, true);
  const vaultNo = getAssociatedTokenAddressSync(usdcMint, market, true);
  const treasuryUsdc = getAssociatedTokenAddressSync(usdcMint, new PublicKey(process.env.NEXT_PUBLIC_TREASURY!));

  const userUsdc = getAssociatedTokenAddressSync(usdcMint, trader);
  const positionSeeds = [Buffer.from("position"), market.toBuffer(), trader.toBuffer()];
  const position = PublicKey.findProgramAddressSync(positionSeeds, program.programId)[0];
  const method = buyYes ? program.methods.buyYes : program.methods.buyNo;
  await method(new BN(Math.round(amountUsdc * 1_000_000)))
    .accounts({
      trader,
      config: new PublicKey(process.env.NEXT_PUBLIC_CONFIG_PDA!),
      market,
      usdcMint,
      vaultYes,
      vaultNo,
      treasuryUsdc,
      userUsdc,
      position,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function redeem(wallet: any, marketStr: string) {
  const program = await getProgram(wallet);
  const trader = wallet.publicKey as PublicKey;
  const market = new PublicKey(marketStr);
  const usdcMint = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!);
  const vaultYes = getAssociatedTokenAddressSync(usdcMint, market, true);
  const vaultNo = getAssociatedTokenAddressSync(usdcMint, market, true);
  const userUsdc = getAssociatedTokenAddressSync(usdcMint, trader);
  const position = PublicKey.findProgramAddressSync([Buffer.from("position"), market.toBuffer(), trader.toBuffer()], program.programId)[0];

  await program.methods
    .redeem()
    .accounts({
      trader,
      tokenProgram: TOKEN_PROGRAM_ID,
      config: new PublicKey(process.env.NEXT_PUBLIC_CONFIG_PDA!),
      market,
      usdcMint,
      vaultYes,
      vaultNo,
      userUsdc,
      position,
      owner: trader,
    })
    .rpc();
}