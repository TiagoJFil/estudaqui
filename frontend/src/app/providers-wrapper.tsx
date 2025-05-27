"use client"
import { UserProvider } from "@/context/user-context";
import { SessionProvider } from "next-auth/react";

export default function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider session={undefined}>
      <UserProvider>
      {children}
      </UserProvider>
    </SessionProvider>
  );
}