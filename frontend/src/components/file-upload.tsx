"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { Card } from "@/components/ui/card"
import { MAX_FILE_SIZE_MB, VALID_FILE_TYPES } from "@/lib/utils"

type FileUploadProps = {
  uploadedFiles: File[]
  onFilesUploaded: (files: File[]) => void
  showOverlay: boolean // New prop to control overlay state
}

export default function FileUpload(
  { uploadedFiles: files, onFilesUploaded: setFiles, showOverlay }: FileUploadProps
) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
  }, [setFiles])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: VALID_FILE_TYPES,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    disabled: showOverlay // Disable dropzone if overlay is active
  })

  return (
    <Card
      {...getRootProps()}
      className={`p-4 border-2 border-dashed cursor-pointer transition-colors rounded-lg
        ${showOverlay ? 'opacity-50 pointer-events-none' : ''}`} // Add visual feedback when disabled
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center gap-3 text-gray-500">
        <Upload className="h-5 w-5 text-purple-600" />
        <p className="text-sm">
          Upload file
        </p>
        {files.length > 0 && (
          <div className="text-sm text-purple-600 ml-2">
            {files.length} file(s) selected
          </div>
        )}
      </div>
    </Card>
  )
}
