"use client"

import { Button } from "@/components/ui/button"
import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"
import { AuthDropDown } from "./auth-drop-down"
import React, { use, useEffect, useRef, useState } from "react"
import { API } from "@/lib/frontend/api-service"
import { useUserContext } from "@/context/user-context"
import { useSidebar } from "@/context/sidebar-context"
import { useRouter, usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { convertDbDateToDate } from "@/lib/utils"
import { MdDelete, MdModeEdit } from "react-icons/md";
import { ChevronLeft, ChevronRight } from "lucide-react"

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

function UploadRow({ upload, onSelectExam, currentPath }: { upload: any, onSelectExam: (id: string) => void, currentPath: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(upload.filename);
  const [isDeleted, setIsDeleted] = useState(false);
  const isDeleting = useRef(false);
  const isSelectingExam = useRef(false);
  
  // Check if we're currently on an exam page
  const isOnExamPage = currentPath === `/exam/${upload.id}`;
  
  if (isDeleted) return null;
  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(upload.filename);
  };

  const handleEditSubmit = async () => {
    if (editValue.trim() === "") {
      alert("Filename cannot be empty");
      return;
    }
    if (editValue === upload.filename) {
      setIsEditing(false);
      return; 
    }
    upload.filename = editValue;
    setIsEditing(false);
    await API.updateHistoryExam(upload.id, editValue)
  };

  const handleEditCancel = () => {
    setEditValue(upload.filename);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleEditSubmit();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  const handleEditButtonClick = () => {
    if (isEditing) {
      handleEditSubmit();
    } else {
      handleEditStart();
    }
  };
  const handleDelete = async () => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    if (!confirm("Are you sure you want to archive this exam? This action cannot be undone.")) {
      isDeleting.current = false;
      return;
    }
    try {
      await API.deleteHistoryExam(upload.id);
      console.log("Exam deleted successfully");
    } catch (error) {
      console.error("Failed to delete exam:", error);
      alert("Failed to archive exam. Please try again later.");
      return;
    }finally {
      isDeleting.current = false;
    }

    setIsDeleted(true);
  };

  const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleEditSubmit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, editValue]);

  return (
    <div ref={containerRef} className={`flex items-center group rounded px-2 py-1 ${
      isOnExamPage ? 'opacity-60' : 'hover:bg-white/10'
    }`}>
      {/* Filename or input */}
      {isEditing ? (
        <input
          className="flex-1 text-xs text-gray-900 rounded px-1 py-0.5 bg-gray-100 focus:outline-none"
          value={editValue}
          autoFocus
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ minWidth: 0 }}
        />
      ) : (        <button
          className={`flex-1 text-left text-xs text-gray-100 truncate ${
            isOnExamPage ? 'cursor-default opacity-60' : 'cursor-pointer hover:text-white'
          }`}
          title={isOnExamPage ? "Currently viewing this exam" : upload.filename}
          onClick={() => {
            if (isSelectingExam.current || isOnExamPage) return;  
            isSelectingExam.current = true;
            onSelectExam(upload.id)
            setTimeout(() => {
              isSelectingExam.current = false;  
            }, 500); 
          }}
        >
          {upload.filename} <span className="text-gray-400">({new Date(convertDbDateToDate(upload.createdAt)).toLocaleDateString()})</span>
        </button>
      )}
      
      {/* Edit icon */}
      <button
        className={`ml-2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity ${
          isEditing 
            ? "text-green-400 hover:text-green-300" 
            : "text-gray-400 hover:text-blue-400"
        }`}
        style={{ cursor: 'pointer' }}
        title={isEditing ? "Save changes" : "Edit name"}
        onClick={handleEditButtonClick}
        tabIndex={0}
        
        aria-label={isEditing ? "Save exam name" : "Edit exam name"}
      >
        <MdModeEdit/>
      </button>
      
      {/* Delete icon */}
      <button
        className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Archive chat"
        onClick={handleDelete}
        disabled={isDeleting.current}
        tabIndex={0}
        style={{ cursor: 'pointer' }}
        aria-label="Archive chat"
      >
        <MdDelete/>
      </button>
    </div>
  );
}

function UploadHistory({ onSelectExam, onAnalyzeNewExam, isCollapsed }: { onSelectExam: (examId: string) => void, onAnalyzeNewExam: () => void, isCollapsed?: boolean }) {
  const { data: session, status } = useSession();
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(status === "loading");
  const pathname = usePathname();

  
  useEffect(() => {
    console.log("UploadHistory useEffect - Session Status:", status);
    if(status === "loading") {
      setLoading(true);
      return;
    }
    if (!session || !session.user || !session.user.email) {
      setLoading(false);
      return;
    }
    const getUploads = async () => {
      try {
        const data = await API.getUserUploads();
        setUploads(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch uploads:", error);
      } finally {
        setLoading(false);
      }
    };
    getUploads();
  }, [status]);


  // Filter and sort uploads by date
  const now = new Date();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const recent = uploads.filter(u => now.getTime() - new Date(convertDbDateToDate(u.createdAt)).getTime() < oneWeekMs);
  const older = uploads.filter(u => now.getTime() - new Date(convertDbDateToDate(u.createdAt)).getTime() >= oneWeekMs);

  return (
    <div className="w-full mt-4">
      {!isCollapsed && (
        <>
          <div className="flex items-center justify-between mb-2 pl-2">
            <div className="text-xs text-gray-200 font-semibold">Your Uploads</div>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold" style={{ cursor: 'pointer' }} onClick={onAnalyzeNewExam}>
              + Analyze New Exam
            </Button>
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-xs text-gray-300 px-2">Loading...</div>
            ) : uploads.length === 0 ? (
              <div className="text-xs text-gray-300 px-2">No uploads yet.</div>
            ) : (
              <>
                {recent.length > 0 && (
                  <>
                    <div className="text-[11px] text-gray-400 font-semibold px-2 mt-1 mb-1">Recent</div>                
                    {recent.map(upload => (
                      <UploadRow
                        key={upload.id}
                        upload={upload}
                        onSelectExam={onSelectExam}
                        currentPath={pathname || ''}
                      />
                    ))}
                  </>
                )}
                {recent.length > 0 && older.length > 0 && (
                  <div className="border-t border-gray-700 my-2" />
                )}
                {older.length > 0 && (
                  <>
                    <div className="text-[11px] text-gray-400 font-semibold px-2 mt-1 mb-1">Older than a week</div>               
                    {older.map(upload => (
                      <UploadRow
                        key={upload.id}
                        upload={upload}
                        onSelectExam={onSelectExam}
                        currentPath={pathname || ''}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
      
      {isCollapsed && (
        <div className="flex flex-col items-center gap-2">
          {/* New Exam Button */}
          <Button
            onClick={onAnalyzeNewExam}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 w-10 h-10"
            title="Analyze New Exam"
          >
            <span className="text-2xl">+</span>
          </Button>
          
          {/* Recent files as icons */}
          {uploads.slice(0, 5).map((upload, index) => (
            <Button
              key={upload.id}
              onClick={() => onSelectExam(upload.id)}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 w-10 h-10"
              title={upload.filename}
            >
              <span className="text-sm">📄</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(status === "loading")
  const { isCollapsed, toggleCollapse } = useSidebar()

  useEffect(() => {
    console.log("Session Status:", status)
    if (isLoading) {
      return
    }
    if (!session || !session.user || !session.user.email) {
        setIsLoading(false)
      return
    }
  }, [status])

  const handleSignIn = async (platform:string) => {
    await signIn(platform)
  }

  return (
    <nav className="flex flex-col items-center pt-8 pb-4 px-2 w-full h-full bg-gradient-to-b from-[#232946] via-[#3b4371] to-[#4f5fa3] relative">
      {/* Collapse/Expand Button - stays on the right when collapsed */}
      <Button
        onClick={toggleCollapse}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/10 z-10 transition-all duration-500 ease-in-out"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      <div className="flex flex-col items-center w-full mb-8 mt-8">
        {/* Logo and app name at the top, horizontally aligned and top-aligned, centered as a group */}
        <div className="flex flex-row items-center gap-2 justify-center w-full" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
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
          {!isCollapsed && (
            <span className="text-3xl font-extrabold text-white tracking-tight font-sans select-none" style={{letterSpacing: '-0.03em'}}>Studaki</span>
          )}
        </div>
      </div>
      
      <UploadHistory 
        onSelectExam={(examId) => router.push(`/exam/${examId}`)}
        onAnalyzeNewExam={() => router.push('/')}
        isCollapsed={isCollapsed}
      />
    </nav>
  );
}
