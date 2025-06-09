import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ProvidersWrapper from "./providers-wrapper"
import { Footer } from "@/components/ui/footer"
import Navbar from "@/components/navbar"

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
      
        <body className={inter.className}>
          <ProvidersWrapper>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Navbar />
              <main className="flex-1 flex justify-center">
                <div className="w-full">
                  {children}
                </div>
              </main>
              <Footer />
            </div>
          </ProvidersWrapper>
        </body>
      
    </html>
  )
}
