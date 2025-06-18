"use client"

import { useSession, signIn } from "next-auth/react";
import { AuthDropDown } from "@/components/auth-drop-down";
import {  useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import FileUpload from "@/components/file-upload"
import { useUserContext } from "@/context/user-context"
import { useRouter } from "next/navigation"
import FileDragDropOverlay from "@/components/file-drag-drop-overlay"
import { API } from "@/lib/frontend/api-service"
import { Button } from "@/components/ui/button"
import UploadProgressOverlay from "@/components/upload-progress-overlay"

export default function Home() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [output, setOutput] = useState("");
    const { credits, setCredits } = useUserContext();
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [showFileUploadOverlay, setShowFileUploadOverlay] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState("Uploading exam...");
    const [processingSuccess, setProcessingSuccess] = useState(false);

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
        if (!session) {
            alert("You must be signed in to process files.");
            return;
        }
        if (uploadedFiles.length === 0) {
            alert("No files uploaded")
            return
        }
        try {
            setProcessingMessage("Uploading exam...");
            setProcessingSuccess(false);
            setProcessing(true);
            const examJson = await API.uploadFiles(uploadedFiles);
            if (!examJson || Object.keys(examJson).length === 0) {
                setProcessing(false);
                alert("No exam data found in the uploaded files")
                return
            }
            setOutput(JSON.stringify(examJson, null, 2));
            setCredits(credits - 1);
            localStorage.setItem(`examData_${examJson.examId}`, JSON.stringify(examJson));
            setProcessingMessage("Exam published! Redirecting...");
            setProcessingSuccess(true);
            setTimeout(() => {
                router.push("/exam/" + examJson.examId);
            }, 1200);
        } catch (error) {
            setProcessing(false);
            alert("Failed to process request")
        }
    }

    const onFileRemove = (index: number) => {
        setUploadedFiles((currentFiles) => {
            const updatedFiles = [...currentFiles]
            updatedFiles.splice(index, 1) // Remove file at specified index
            return updatedFiles
        })
    }

    // Only allow file drop if logged in, otherwise use a no-op
    const handleFileDrop = session ? appendFiles : () => {};

    return (
        <div className="min-h-auto flex flex-col">
            <UploadProgressOverlay open={processing} message={processingMessage} success={processingSuccess} />
            <FileDragDropOverlay showOverlay={showFileUploadOverlay} setShowOverlay={setShowFileUploadOverlay} onFileDrop={handleFileDrop} />
            <main className="container mx-auto px-4 py-12 max-w-3xl w-full flex-1">
                <div className="space-y-8 w-full">
                    <div className="bg-white rounded-xl shadow-md p-8 space-y-6 border border-gray-100 w-full">
                        <h1 className="text-2xl font-bold text-gray-900">Upload Exam (PDF)</h1>
                        <p className="text-gray-600 text-base">Upload your exam file in PDF format. Drag and drop or use the button below. Duplicate files are automatically ignored. Only PDF files are allowed.</p>
                        {!session ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="text-lg text-gray-700">You must be signed in to upload files.</div>
                                <AuthDropDown onSignIn={(platform) => { signIn(platform); }} />
                            </div>
                        ) : (
                            <FileUpload
                                showOverlay={showFileUploadOverlay}
                                onFileRemove={onFileRemove}
                                onFilesUploaded={appendFiles}
                                uploadedFiles={uploadedFiles}
                            />
                        )}
                        <div className="flex gap-3 items-center justify-end pt-2">
                            {session && (
                                <Button
                                    onClick={handleProcess}
                                    size="lg"
                                    className={cn(
                                        "bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                                        uploadedFiles.length === 0 && "opacity-60 cursor-not-allowed"
                                    )}
                                    disabled={uploadedFiles.length === 0}
                                    aria-label="Process uploaded files"
                                >
                                    <Upload className="h-5 w-5 mr-2" />
                                    Process PDF
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <footer className="w-full text-center text-xs text-gray-400 py-2 mb-4">
                You have <span className="font-semibold text-teal-600">{credits}</span> credits remaining.
            </footer>
        </div>
    );
}
