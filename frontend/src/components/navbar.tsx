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
import { convertDbDateToDate } from "@/lib/utils"


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
      <span className="text-xl font-semibold">Studaki</span>
    </div>
  )
}

function UploadHistory({ onSelectExam }: { onSelectExam: (examId: string) => void }) {
  const { data: session } = useSession();
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    const getUploads = async () => {
      try {
        setLoading(true);
        const data = await API.getUserUploads();
        setUploads(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch uploads:", error);
      } finally {
        setLoading(false);
      }
    }
    getUploads();
  }, [session]);

  if (!session) return null;

  return (
    <div className="w-full mt-4">
      <div className="text-xs text-gray-200 font-semibold mb-2 pl-2">Your Uploads</div>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-xs text-gray-300 px-2">Loading...</div>
        ) : uploads.length === 0 ? (
          <div className="text-xs text-gray-300 px-2">No uploads yet.</div>
        ) : (
          uploads.map(upload => (
            <button
              key={upload.id}
              className="text-left px-2 py-1 rounded hover:bg-white/10 text-xs text-gray-100 truncate"
              title={upload.filename}
              onClick={() => onSelectExam(upload.id)}
            >
              {upload.filename} <span className="text-gray-400">({new Date(convertDbDateToDate(uploads[0].createdAt)).toLocaleDateString()})</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
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
          <span className="text-3xl font-extrabold text-white tracking-tight font-sans select-none" style={{letterSpacing: '-0.03em'}}>Studaki</span>
        </div>
      </div>
      <UploadHistory onSelectExam={(examId) => router.push(`/exam/${examId}`)} />
    </nav>
  )
}
