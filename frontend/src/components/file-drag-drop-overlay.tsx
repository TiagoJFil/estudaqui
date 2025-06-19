import { isValidFile } from "@/lib/utils";
import React, { useState, useCallback } from "react";

type FileDragDropOverlayProps = {
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  onFileDrop: (files: File[]) => void; // Optional callback for file drop
}

export function FileDragDropOverlay({ showOverlay, setShowOverlay,onFileDrop }: FileDragDropOverlayProps) {
  const [dragCounter, setDragCounter] = useState(0); // Track drag events
  
  // For debugging
  React.useEffect(() => {
    console.log(`Overlay state: ${showOverlay ? 'visible' : 'hidden'}, Drag counter: ${dragCounter}`);
  }, [showOverlay, dragCounter]);
  
  // Handle drag enter - increment counter and show overlay
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setShowOverlay(true);
  }, [setShowOverlay]);
  // Handle drag over - prevent default to allow drop
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOverlay(true); // Ensure overlay stays visible
  }, [setShowOverlay]);

  // Handle drag leave - decrement counter and hide overlay when counter reaches 0
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount <= 0) {
        setShowOverlay(false);
        return 0;
      }
      return newCount;
    });
  }, [setShowOverlay]);  // Handle drop - process the file
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0); // Reset drag counter
    setShowOverlay(false);

    // Get the dropped files
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    
    if (droppedFiles.length === 0) return;
    
    // Only process the first file if multiple files are dropped
    const fileToProcess = [droppedFiles[0]];
    
    // Guarantee that only pdf and .docx files are accepted
    const validFiles = fileToProcess.filter(file =>
      isValidFile(file)
    );
    
    if (validFiles.length !== fileToProcess.length) {
      alert("Only PDF files are allowed, and file size must be less than 20MB.");
      return;
    }
    
    if (validFiles.length > 0) {
      onFileDrop(validFiles);
    }
  }, [setShowOverlay, onFileDrop]);
  // Setup global event listeners once
  React.useEffect(() => {
    // Add event listeners to the document
    document.addEventListener("dragenter", handleDragEnter as EventListener);
    document.addEventListener("dragover", handleDragOver as EventListener);
    document.addEventListener("dragleave", handleDragLeave as EventListener);
    document.addEventListener("drop", handleDrop as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener("dragenter", handleDragEnter as EventListener);
      document.removeEventListener("dragover", handleDragOver as EventListener);
      document.removeEventListener("dragleave", handleDragLeave as EventListener);
      document.removeEventListener("drop", handleDrop as EventListener);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return (
    <>
      {showOverlay && (
      <div
        style={{
        ...overlayStyles,
        background: "rgba(30, 41, 59, 0.92)",
        color: "#f1f5f9",
        fontFamily: "Inter, sans-serif",
        letterSpacing: "0.01em",
        backdropFilter: "blur(4px)",
        pointerEvents: "auto",
        transition: "background 0.2s",
        }}
      >
        <div
        style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: "1.5rem",
          padding: "2.5rem 3.5rem",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          border: "1.5px solid rgba(255,255,255,0.18)",
          maxWidth: "90vw",
        }}
        >
        <div
          style={{
          fontSize: "3.5rem",
          marginBottom: "1.2rem",
          filter: "drop-shadow(0 2px 8px #0ea5e9)",
          userSelect: "none",
          }}
          aria-hidden
        >
          <span role="img" aria-label="Upload">📄</span>
        </div>
        <div
          style={{
          fontWeight: 700,
          fontSize: "1.5rem",
          marginBottom: "0.5rem",
          textAlign: "center",
          letterSpacing: "0.02em",
          }}
        >
          Drop your file here
        </div>
        <div
          style={{
          fontWeight: 400,
          fontSize: "1rem",
          color: "#cbd5e1",
          textAlign: "center",
          marginBottom: "0.5rem",
          }}
        >
          Only <span style={{ color: "#38bdf8", fontWeight: 600 }}>PDF</span> files under 20MB
        </div>
        <div
          style={{
          marginTop: "0.5rem",
          fontSize: "0.95rem",
          color: "#64748b",
          textAlign: "center",
          }}
        >
          Or right click anywhere to cancel
        </div>
        </div>
      </div>
      )}
    </>
  );
};

const overlayStyles: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  fontSize: "2rem",
  pointerEvents: "all", // Changed to "all" to capture all events
  transition: "opacity 0.2s ease-in-out",
};

export default FileDragDropOverlay;
