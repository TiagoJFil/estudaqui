"use client"

import { Footer } from "@/components/ui/footer"
import Navbar from "@/components/navbar"
import CreditsAndSignIn from "@/components/CreditsAndSignIn"
import { SidebarProvider, useSidebar } from "@/context/sidebar-context"
import { Toaster } from "sonner"

function SidebarLayout() {
  const { isCollapsed } = useSidebar()
  
  return (
    <aside className={`hidden md:flex flex-col bg-gradient-to-b from-[#232946] via-[#3b4371] to-[#4f5fa3] z-20 min-h-full h-auto shadow-[4px_0_16px_-4px_rgba(60,60,120,0.13)] transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <Navbar />
    </aside>
  )
}

function MainContent({ children }: { children: React.ReactNode }) {
  return (
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
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full">
        <div className="flex flex-1 w-full">
          {/* Sidebar Navbar */}
          <SidebarLayout />
          {/* Main Content Area */}
          <MainContent>
            {children}
          </MainContent>
        </div>
        <Footer />
      </div>
      <Toaster position="top-right" richColors closeButton duration={5000} />
    </SidebarProvider>
  )
}
