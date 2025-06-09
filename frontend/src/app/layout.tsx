import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ProvidersWrapper from "./providers-wrapper"
import { Footer } from "@/components/ui/footer"
import Navbar from "@/components/navbar"
import CreditsAndSignIn from "@/components/CreditsAndSignIn"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Examify - Study Assistant",
  description: "Your AI-powered study companion",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={inter.className + " bg-gradient-to-br from-[#f6f8fc] to-[#eaf1fb] min-h-screen"}>
        <ProvidersWrapper>
          <div className="flex flex-col min-h-screen w-full">
            <div className="flex flex-1 w-full">
              {/* Sidebar Navbar */}
              <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#232946] via-[#3b4371] to-[#4f5fa3] z-20 min-h-full h-auto shadow-[4px_0_16px_-4px_rgba(60,60,120,0.13)]">
                <Navbar />
              </aside>
              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-full">
                {/* Top Bar for credits/sign-in */}
                <header className="w-full flex items-center justify-end px-4 py-3 bg-transparent">
                  <CreditsAndSignIn />
                </header>
                {/* Main Content */}
                <main className="flex-1 flex flex-col items-center w-full px-0 sm:px-2 md:px-4 py-4">
                  {children}
                </main>
              </div>
            </div>
            <Footer />
          </div>
        </ProvidersWrapper>
      </body>
    </html>
  )
}
