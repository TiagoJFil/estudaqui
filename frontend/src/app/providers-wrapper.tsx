"use client"
import { UserProvider } from "@/context/user-context";
import { SessionProvider } from "next-auth/react";
// Solana wallet adapter imports
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

export default function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  // Use custom RPC endpoint or fallback to Devnet
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com'
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[new PhantomWalletAdapter(), new SolflareWalletAdapter()] } onError={console.log}  autoConnect>
        <WalletModalProvider>
          <SessionProvider session={undefined}>
            <UserProvider>
              {children}
            </UserProvider>
          </SessionProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}