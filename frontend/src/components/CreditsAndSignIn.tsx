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
    setCredits(session.user.credits)
    setIsLoading(false);
  }, [status]);

  return (
    <div className="flex items-center gap-4">
      {isLoading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <div className="text-lg font-bold text-gray-600">
          Credits: {credits}
        </div>
      )}
      <Button
        onClick={() => router.push("/buy")}
        className="hover:bg-gray-200 hover:text-black transition-colors"
      >
        Buy More
      </Button>
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
          )}
          <Button
            variant="outline"
            className="hover:bg-gray-50"
            onClick={() => signOut()}
          >
            Sign Out
          </Button>
        </>
      ) : (
        <AuthDropDown onSignIn={(platform) => { signIn(platform); }} />
      )}
    </div>
  );
}
