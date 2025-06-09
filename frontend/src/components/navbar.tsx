"use client"

import { Button } from "@/components/ui/button"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { AuthDropDown } from "./AuthDropDown"
import { useEffect } from "react"
import { getUserInfo } from "@/lib/api-service"
import { useUserContext } from "@/context/user-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"


export default function Navbar() {
  const { data: session, status } = useSession()
  const { credits, setCredits } = useUserContext();
  const router = useRouter()

  useEffect(() => {
    console.log("Session Status:", status)
    if (status === "loading") {
      return
    }
    if (!session || !session.user || !session.user.email) {
      return
    }
    getUserInfo().then((userInfo) => {
      if (userInfo && userInfo.credits) {
        setCredits(userInfo.credits)
      }
    }).catch((error) => {
      console.error("Failed to fetch user info:", error)
      alert("Failed to fetch user information")
    })
  }, [credits, status])

  return (
    <nav className="flex flex-col items-center pt-8 pb-4 px-2 w-full h-full bg-gradient-to-b from-[#232946] via-[#3b4371] to-[#4f5fa3]">
      <div className="flex flex-col items-center w-full mb-8">
        {/* Logo and app name at the top, horizontally aligned and top-aligned, centered as a group */}
        <div className="flex flex-row items-center gap-2 justify-center w-full">
          <div className="flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="24" height="24" rx="7" fill="url(#paint0_linear_1_2)"/>
              <path d="M9 14.5C9 12.0147 11.0147 10 13.5 10C15.9853 10 18 12.0147 18 14.5C18 16.9853 15.9853 19 13.5 19C11.0147 19 9 16.9853 9 14.5Z" fill="white"/>
              <defs>
                <linearGradient id="paint0_linear_1_2" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366F1"/>
                  <stop offset="1" stopColor="#A21CAF"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-3xl font-extrabold text-white tracking-tight font-sans select-none" style={{letterSpacing: '-0.03em'}}>Examify</span>
        </div>
      </div>
    </nav>
  )
}
