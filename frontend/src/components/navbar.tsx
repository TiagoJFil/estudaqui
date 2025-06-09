"use client"

import { Button } from "@/components/ui/button"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { AuthDropDown } from "./auth-drop-down"
import { useEffect, useState } from "react"
import { API } from "@/lib/frontend/api-service"
import { useUserContext } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"


function AppIcon () {
  return (
    <div className="flex items-center gap-2">

      <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 14l9-5-9-5-9 5 9 5z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 14l9-5-9-5-9 5 9 5z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-xl font-semibold">Examify</span>
    </div>
  )
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const { credits, setCredits } = useUserContext();
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(status === "loading")

  useEffect(() => {
    console.log("Session Status:", status)
    if (status === "loading") {
      return
    }
    if (!session || !session.user || !session.user.email) {
        setIsLoading(false)
      return
    }
    API.getUserInfo().then((userInfo) => {
      if (userInfo && userInfo.credits) {
        setCredits(userInfo.credits)
        setIsLoading(false)
      }
    }).catch((error) => {
      console.error("Failed to fetch user info:", error)
      alert("Failed to fetch user information")
    })
  }, [status])

  const handleSignIn = async (platform:string) => {
    await signIn(platform)
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          <AppIcon/>
        </div>

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
            <AuthDropDown onSignIn={handleSignIn} />
          )}
        </div>
      </div>
    </nav>
  )
}
