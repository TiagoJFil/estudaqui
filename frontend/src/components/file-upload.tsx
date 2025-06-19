"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Trash2, FileText, Image, Film, Music } from "lucide-react"
import { Card } from "@/components/ui/card"
import { VALID_FILE_TYPES, MAX_FILE_SIZE_MB } from "@/lib/contants"

type FileUploadProps = {
  uploadedFiles: File[]
  onFilesUploaded: (files: File[]) => void
  onFileRemove: (index: number) => void 
  showOverlay: boolean // New prop to control overlay state
}

export default function FileUpload(
  { uploadedFiles: files, onFilesUploaded: setFiles,onFileRemove , showOverlay }: FileUploadProps
) {  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Only use the first file from acceptedFiles
      setFiles([acceptedFiles[0]])
    }
  }, [setFiles])

  const removeFile = useCallback((index: number) => {
    console.log(`Removing file at index ${index}:`, files[index])

    onFileRemove(index)
  }, [files, setFiles])

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image
    if (fileType.startsWith('video/')) return Film
    if (fileType.startsWith('audio/')) return Music
    return FileText
  }
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: VALID_FILE_TYPES,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    disabled: showOverlay, // Disable dropzone if overlay is active
    noClick: false,
    noKeyboard: true,
    preventDropOnDocument: false // Allow global overlay to handle document-level drops
  })
  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <Card
        {...getRootProps()}
        className={`p-4 border-2 border-dashed cursor-pointer transition-colors rounded-lg
          ${showOverlay ? 'opacity-50 pointer-events-none' : ''}`} // Add visual feedback when disabled
      >
        <input {...getInputProps()} />        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Upload className="h-5 w-5 text-purple-600" />
          <p className="text-sm">
            {files.length > 0 ? 'Replace current file' : 'Upload file'}
          </p>
          {files.length > 0 && (
            <div className="text-sm text-purple-600 ml-2">
              File selected
            </div>
          )}
        </div>
      </Card>

      {/* File Preview Section */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((file, index) => {
            const FileIcon = getFileIcon(file.type)
            return (
              <Card
                key={`${file.name}-${index}`}
                className="relative p-3 hover:shadow-md transition-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors z-10 cursor-pointer"
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {/* File Preview */}
                <div className="flex flex-col items-center space-y-2">
                  {file.type.startsWith('image/') ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileIcon className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  
                  {/* File Info */}
                  <div className="text-center w-full">
                    <p className="text-xs font-medium text-gray-700 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
