"use client"

import { useEffect, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import FileUpload from "@/components/file-upload"
import { useSession } from "next-auth/react"
import {  uploadFilesToServer } from "@/lib/api-service"
import { useUserContext } from "@/context/user-context"
import FileDragDropOverlay from "@/components/ui/file-drag-drop-overlay"

export default function Home() {
    const { data: session, status  } = useSession()
    const [output, setOutput] = useState("")
  const { credits, setCredits } = useUserContext();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showFileUploadOverlay, setShowFileUploadOverlay] = useState(false);

  // Function to append files preventing duplicates based on name, size, and lastModified
  const appendFiles = (newFiles: File[]) => {
    setUploadedFiles((currentFiles) => {
      // Create a map of existing files for quick lookup
      const existingFilesMap = new Map<string, File>()
      currentFiles.forEach(file => {
        const key = `${file.name}-${file.size}-${file.lastModified}`
        existingFilesMap.set(key, file)
      })

      // Filter new files to exclude duplicates
      const filteredNewFiles = newFiles.filter(file => {
        const key = `${file.name}-${file.size}-${file.lastModified}`
        return !existingFilesMap.has(key)
      })

      // Return combined array of existing files and filtered new files
      return [...currentFiles, ...filteredNewFiles]
    })
  }

    const handleProcess = async () => {
        if (uploadedFiles.length === 0) {
            alert("No files uploaded")
            return
        }
        try {
            const examJson = await uploadFilesToServer(uploadedFiles)
            if (!examJson || Object.keys(examJson).length === 0) {
                alert("No exam data found in the uploaded files")
                return
            }
            setOutput(JSON.stringify(examJson, null, 2)) // Format JSON output
            setCredits(credits - 1) // Decrease credits after processing
        } catch (error) {
            alert("Failed to process request")
        }
    }



    return (
        <div>
            <FileDragDropOverlay showOverlay={showFileUploadOverlay} setShowOverlay={setShowFileUploadOverlay} onFileDrop={appendFiles}  />
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                        <FileUpload  showOverlay={showFileUploadOverlay} onFilesUploaded={appendFiles} uploadedFiles={uploadedFiles} />
                        
                        <div className="flex gap-2 items-center">
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
            </div>
    )
}
