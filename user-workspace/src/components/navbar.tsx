"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  onAuthClick: () => void
}

export default function Navbar({ onAuthClick }: NavbarProps) {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5"
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

        <Button
          variant="outline"
          className="flex items-center gap-2 hover:bg-gray-50"
          onClick={onAuthClick}
        >
          Sign in
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  )
}
