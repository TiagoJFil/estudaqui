import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ProvidersWrapper from "./providers-wrapper"
import ClientLayout from "@/components/client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Studaki - Study Assistant",
  description: "Your AI-powered study companion",
}//TODO: change this

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
          <ClientLayout>
            {children}
          </ClientLayout>
        </ProvidersWrapper>
      </body>
    </html>
  )
}
