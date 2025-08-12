"use client";
import { getProgram, pdas } from "./anchorClient";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

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
