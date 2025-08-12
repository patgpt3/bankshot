import { AnchorProvider, Program, Idl, web3 } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

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
