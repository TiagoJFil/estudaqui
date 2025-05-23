"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload } from "lucide-react"
import { Card } from "@/components/ui/card"

type FileUploadProps = {
  uploadedFiles: File[]
  onFilesUploaded: (files: File[]) => void
}
export default function FileUpload(
  { uploadedFiles: files , onFilesUploaded: setFiles }: FileUploadProps
) {

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

  return (
    <Card
      {...getRootProps()}
      className={`p-4 border-2 border-dashed cursor-pointer transition-colors rounded-lg
        ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-500'}`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center gap-3 text-gray-500">
        <Upload className="h-5 w-5 text-purple-600" />
        <p className="text-sm">
          {isDragActive
            ? "Drop your files here"
            : "Upload file"}
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
