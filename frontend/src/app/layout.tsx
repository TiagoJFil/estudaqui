import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import ProvidersWrapper from "./providers-wrapper"
import { useTranslation } from "react-i18next"
import { Footer } from "@/components/ui/footer"

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
      <ProvidersWrapper>
        <body className={inter.className}>
          {children}
          <Footer />
        </body>
      </ProvidersWrapper>
    </html>
  )
}
