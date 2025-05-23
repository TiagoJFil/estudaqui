"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Navbar from "@/components/navbar"
import FileUpload from "@/components/file-upload"
import AuthModal from "@/components/auth-modal"

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [output, setOutput] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) {
      alert("No files uploaded")
      return
    }

    const formData = new FormData()
    uploadedFiles.forEach((file) => formData.append("files", file))
    formData.append("prompt", prompt)

    try {
      const response = await fetch("/api/process", {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const responseData = await response.json()

      setOutput(responseData)
    } catch (error) {
      console.error("Error processing request:", error)
      alert("Failed to process request")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onAuthClick={() => setIsAuthOpen(true)} />
      <AuthModal open={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <FileUpload onFilesUploaded={setUploadedFiles} uploadedFiles={uploadedFiles} />
            
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Type your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleProcess}
                size="icon"
                className={cn(
                  "bg-teal-500 hover:bg-teal-600 text-white",
                  "transition-colors duration-200"
                )}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            {output && (
              <Card className="mt-6 p-4 bg-white border border-gray-200">
                <h2 className="text-lg font-semibold mb-2">Processed Output:</h2>
                <div className="prose prose-sm max-w-none">
                  {output}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        <p className="mb-1">© 2025 Examify</p>
        <a href="#" className="hover:underline">Privacy Policy</a>
      </footer>
    </div>
  )
}
