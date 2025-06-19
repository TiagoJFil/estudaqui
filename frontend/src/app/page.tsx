"use client"

import { useSession, signIn } from "next-auth/react";
import { AuthDropDown } from "@/components/auth-drop-down";
import React, { useState, useCallback, useEffect } from "react"
import { Upload, Loader2, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import FileUpload from "@/components/file-upload"
import { useUserContext } from "@/context/user-context"
import { useRouter } from "next/navigation"
import FileDragDropOverlay from "@/components/file-drag-drop-overlay"
import { API } from "@/lib/frontend/api-service"
import { Button } from "@/components/ui/button"

export default function Home() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [output, setOutput] = useState("");
    const { credits, setCredits } = useUserContext();
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showFileUploadOverlay, setShowFileUploadOverlay] = useState(false);
  // Function to handle file uploads, allowing only one file
  const appendFiles = (newFiles: File[]) => {
    // If there are already files uploaded, replace them with the new file
    // Otherwise, add the new file (taking only the first one if multiple are provided)
    setUploadedFiles(currentFiles => {
      if (newFiles.length === 0) return currentFiles;
      
      // Only take the first file from the new files
      const newFile = newFiles[0];
        // Replace existing file (if any) with the new one
      return [newFile];
    });
  }
  
  const handleProcess = async () => {
        if (!session) {
            alert("You must be signed in to process files.");
            return;
        }
        if (uploadedFiles.length === 0) {
            alert("No file uploaded")
            return
        }
        setIsProcessing(true);
        try {
            const file = uploadedFiles[0]; 
            const examJsonResponse =  await API.uploadFile(file);
            const examJson = examJsonResponse.examJson
            if (!examJson || Object.keys(examJson).length === 0) {
                alert("No exam data found in the uploaded files")
                setIsProcessing(false);
                return
            }
            setOutput(JSON.stringify(examJson, null, 2));
            // Check if exam already exists in user history to avoid spending credits
            if (!examJsonResponse.isInUserUploads) {
              setCredits(credits - 1);
            }
            localStorage.setItem("examData", JSON.stringify(examJson));
            setIsSuccess(true);
            // Redirect after brief confirmation
            setTimeout(() => {
                router.push("/exam/" + examJson.examId);
            }, 2000);
         } catch (error) {
            alert("Failed to process request")
            setIsProcessing(false);
         }
    }

    const onFileRemove = (index: number) => {
        setUploadedFiles((currentFiles) => {
            const updatedFiles = [...currentFiles]
            updatedFiles.splice(index, 1) // Remove file at specified index
            return updatedFiles
        })
    }    // Only allow file drop if logged in, otherwise use a no-op
    const handleFileDrop = useCallback(
        (files: File[]) => {
            if (session) {
                console.log("Files dropped:", files);
                appendFiles(files);
            }
        },
        [session, appendFiles]
    );    // Reset drag state when component unmounts
    useEffect(() => {
        return () => {
            // Cleanup function
            setShowFileUploadOverlay(false);
        };
    }, []);
    
    return (
        <div className="min-h-auto flex flex-col">
            <FileDragDropOverlay showOverlay={showFileUploadOverlay} setShowOverlay={setShowFileUploadOverlay} onFileDrop={handleFileDrop} />
            <main className="container mx-auto px-4 py-12 max-w-3xl w-full flex-1">
                <div className="space-y-8 w-full">
                    <div className="bg-white rounded-xl shadow-md p-8 space-y-6 border border-gray-100 w-full">                        <h1 className="text-2xl font-bold text-gray-900">Upload Exam (PDF)</h1>
                        <p className="text-gray-600 text-base">Upload a single exam file in PDF format. Drag and drop or use the button below. Only one PDF file is allowed at a time.</p>
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
                                        (uploadedFiles.length === 0 || isProcessing || isSuccess) && "opacity-60 cursor-not-allowed"
                                    )}
                                    disabled={uploadedFiles.length === 0 || isProcessing || isSuccess}
                                    aria-label="Process uploaded files"
                                >
                                    {isSuccess ? (
                                        <>
                                            <CheckCircle className="h-5 w-5 mr-2 text-green-100 animate-pulse" />
                                            Published! Redirecting...
                                        </>
                                    ) : isProcessing ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5 mr-2" />
                                            Process PDF
                                        </>
                                    )}
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
