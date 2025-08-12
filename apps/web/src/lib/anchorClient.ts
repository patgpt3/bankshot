import { AnchorProvider, Idl, Program, web3, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../../programs/launchpad/target/idl/launchpad.json" assert { type: "json" };

export function getProgram(wallet: any) {
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC!, "confirmed");
  const provider = new AnchorProvider(connection as any, wallet, { commitment: "confirmed" } as any);
  // @ts-ignore
  return new Program(idl as Idl, new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!), provider);
}

export function pdas(program: Program, nftMint: PublicKey, seller: PublicKey) {
  const listing = web3.PublicKey.findProgramAddressSync([
    Buffer.from("listing"),
    nftMint.toBuffer(),
    seller.toBuffer(),
  ], program.programId)[0];
  return { listing };
}
