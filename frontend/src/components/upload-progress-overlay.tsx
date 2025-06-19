"use client"

import { Loader2, CheckCircle } from "lucide-react"

export default function UploadProgressOverlay({ open, message, success }:{
  open: boolean
  message: string
  success?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center gap-3">
        {success ? (
          <CheckCircle className="w-8 h-8 text-green-600 animate-bounce-once" />
        ) : (
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        )}
        <p className="text-gray-700 font-medium text-center">{message}</p>
      </div>
    </div>
  )
}
