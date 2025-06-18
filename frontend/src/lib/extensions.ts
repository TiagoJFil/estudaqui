import { Transaction } from "@solana/web3.js";
//import above is necessary to turn this file into a module

declare module "@solana/web3.js" {
  interface Transaction {
    addMemo(memo: string): this;
  }
}

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      credits?: number;
    };
  }
}