"use client"

import { useEffect, useState } from "react"
import { Clock, FileText, RefreshCw, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { PDFInfo } from "@/lib/data/data-interfaces"
import { API } from "@/lib/frontend/api-service"

interface FileHistoryProps {
  isOpen: boolean
  onToggle: () => void
  onFileSelect?: (file: PDFInfo) => void
  refreshTrigger?: number
}

export default function FileHistory({ isOpen, onToggle, onFileSelect, refreshTrigger }: FileHistoryProps) {
  const [files, setFiles] = useState<PDFInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      const userFiles = await API.getUserUploads()
      setFiles(userFiles)
    } catch (err) {
      setError("Failed to load file history")
      console.error("Error fetching user files:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchFiles()
    }
  }, [isOpen])

  // Refresh when external trigger changes
  useEffect(() => {
    if (isOpen && refreshTrigger !== undefined) {
      fetchFiles()
    }
  }, [refreshTrigger, isOpen])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Invalid date"
    }
  }

  const handleFileClick = (file: PDFInfo) => {
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
        <Button
          onClick={onToggle}
          variant="outline"
          size="icon"
          className="bg-white shadow-lg hover:shadow-xl transition-shadow"
          title="Open file history"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const sidebarWidth = isCollapsed ? "w-16" : "w-80 max-w-[90vw]"

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-20 flex flex-col transition-all duration-300",
        sidebarWidth
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600 flex-shrink-0" />
              {!isCollapsed && (
                <h2 className="text-lg font-semibold text-gray-900">File History</h2>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isCollapsed && (
                <Button
                  onClick={fetchFiles}
                  variant="ghost"
                  size="icon"
                  disabled={loading}
                  className="h-8 w-8"
                  title="Refresh history"
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              )}
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Close history"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isCollapsed ? (
            // Collapsed view - just show file icons
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-12 h-8 bg-gray-200 rounded animate-pulse mx-auto" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center">
                    <div className="text-red-500 text-xs mb-2">Error</div>
                    <Button onClick={fetchFiles} variant="outline" size="sm" className="w-full">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="h-6 w-6 mx-auto text-gray-300" />
                  </div>
                ) : (
                  files.map((file, index) => (
                    <Button
                      key={`${file.filename}-${index}`}
                      variant="ghost"
                      size="icon"
                      className="w-12 h-8 p-1 hover:bg-teal-50"
                      onClick={() => handleFileClick(file)}
                      title={file.filename}
                    >
                      <FileText className={cn(
                        "h-4 w-4",
                        file.examInfo ? "text-teal-600" : "text-gray-600"
                      )} />
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            // Expanded view - full content
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Card key={i} className="p-3">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">{error}</div>
                    <Button onClick={fetchFiles} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No files uploaded yet</p>
                  </div>
                ) : (
                  files.map((file, index) => (
                    <Card
                      key={`${file.filename}-${index}`}
                      className={cn(
                        "p-3 cursor-pointer transition-all duration-200",
                        "hover:shadow-md hover:border-teal-200 border border-gray-200"
                      )}
                      onClick={() => handleFileClick(file)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        {file.examInfo && (
                          <div className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded">
                            Processed
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {files.length} file{files.length !== 1 ? "s" : ""} in history
            </p>
          </div>
        )}
      </div>
    </>
  )
}