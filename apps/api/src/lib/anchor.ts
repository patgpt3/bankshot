import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet, Idl } from "@coral-xyz/anchor";

export async function getProgram() {
  const rpc = process.env.RPC!;
  const connection = new Connection(rpc, "confirmed");
  const secret = Uint8Array.from(JSON.parse(Buffer.from(process.env.ADMIN_SECRET_B64!, "base64").toString("utf8")));
  const kp = Keypair.fromSecretKey(secret);
  const wallet: Wallet = {
    publicKey: kp.publicKey,
    signAllTransactions: async (txs: any[]) => txs.map((t) => { t.partialSign(kp); return t; }),
    signTransaction: async (tx: any) => { tx.partialSign(kp); return tx; },
  } as any;
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const programId = new PublicKey(process.env.PROGRAM_ID!);
  const idl = (await Program.fetchIdl(programId, provider)) as Idl;
  return new Program(idl, programId, provider);
}
