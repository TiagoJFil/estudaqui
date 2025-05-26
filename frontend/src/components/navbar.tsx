"use client"

import { Button } from "@/components/ui/button"
import { useSession, signIn, signOut } from "next-auth/react"
import { useTranslation } from "react-i18next"
import Image from "next/image"
import i18n from "@/lib/i18n"
import { AuthDropDown } from "./AuthDropDown"


interface NavbarProps {
  onBuyMoreClick: () => void,
  credits: number
}

export default function Navbar({ onBuyMoreClick, credits }: NavbarProps) {
  const { data: session } = useSession()
  const { t } = useTranslation('ns1', {i18n, useSuspense:false})

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        </div>

        <div className="flex items-center gap-4">
          <div className="text-lg font-bold text-gray-600">
            {t("navbar.credits")}: {credits}
          </div>

          <Button
            onClick={() => onBuyMoreClick()}
            className="hover:bg-gray-200 hover:text-black transition-colors"
          >
            {t("navbar.buyMore")}
          </Button>

          {session ? (
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
                {t("signOut")}
              </Button>
            </>
          ) : (
            <AuthDropDown onSignIn={ (platform) => {signIn(platform)}}/>
          )}
        </div>
      </div>
    </nav>
  )
}
