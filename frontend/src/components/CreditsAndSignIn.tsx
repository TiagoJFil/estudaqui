"use client";

import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/user-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/lib/frontend/api-service";
import { AuthDropDown } from "./auth-drop-down";
import { BuyCreditsButton } from "@/components/BuyCreditsButton";
import { StyledAuthDropDown } from "@/components/styled-auth-dropdown";
import "@/styles/credit-pop.css";

export default function CreditsAndSignIn() {
  const { data: session, status } = useSession();
  const { credits, setCredits } = useUserContext();
  const [isLoading, setIsLoading] = useState(status === "loading");
  const router = useRouter();

  useEffect(() => {
    console.log("Session status:", status);
    if (status === "loading") return;
    if (!session || !session.user || !session.user.email) {
      setIsLoading(false);
      return;
    }
    console.log("Session data:", session);
    setCredits(session.user.credits!)
    setIsLoading(false);
  }, [status]);  return (
    <div className="flex flex-row items-center justify-end min-h-[48px] px-2 w-full">
      {isLoading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <>
          <div className="flex items-center mr-4">
            <span className="text-sm text-gray-500 mr-2">CREDITS</span>
            <span className="text-xl font-bold text-indigo-600 animate-credit-pop" key={credits}>{credits}</span>
          </div>          <BuyCreditsButton
            onClick={() => router.push("/buy")}
            className="mr-4"
          >
            Buy More Credits
          </BuyCreditsButton>
        </>
      )}
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-20" />
        </div>
      ) : session ? (
        <>
          <span className="text-sm font-medium text-gray-700">
            {session.user?.name}
          </span>
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="User Profile"
              width={32}
              height={32}
              className="rounded-full"
            />
          )}          <button
            onClick={() => signOut()}
            className="ml-1 sm:ml-2 px-3 py-1.5 bg-gradient-to-tr from-gray-400 to-gray-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 hover:cursor-pointer transition-transform focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </>      ) : (
        <StyledAuthDropDown onSignIn={(platform) => { signIn(platform); }} />
      )}
    </div>
  );
}
