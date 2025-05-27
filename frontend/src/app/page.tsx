"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Navbar from "@/components/navbar"
import FileUpload from "@/components/file-upload"
import { useSession } from "next-auth/react"
import { uploadFilesToServer } from "@/lib/api-service"

export default function Home() {
    const { data: session } = useSession()
    const [output, setOutput] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [credits, setCredits] = useState(1)

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

    console.log("Session:", session)
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar onBuyMoreClick={() =>{} } credits={credits} />
        
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                        <FileUpload onFilesUploaded={setUploadedFiles} uploadedFiles={uploadedFiles} />
                        
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

            <footer className="py-6 text-center text-sm text-gray-500">
                <p className="mb-1">© 2025 Examify</p>
                <a href="#" className="hover:underline">Privacy Policy</a>
            </footer>
        </div>
    )
}
