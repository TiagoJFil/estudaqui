"use client";
import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface FileUploadAreaProps {
  onFileSelected: (file: File) => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileSelected }) => {
  const t = useTranslations('HomePage');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        onFileSelected(file);
      }
    }
  }, [onFileSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [onFileSelected]);

  return (
    <div className="w-full">
      <p className="text-sm mb-6">
        {t('dropzoneText')}
      </p>
      
      {/* Dotted line upload area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-10 mb-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-102' 
            : selectedFile 
              ? 'border-green-500' 
              : 'border-primary'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input 
          id="fileInput" 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          onChange={handleFileInput} 
        />
        
        <div className={`mb-4 ${selectedFile ? 'text-green-500' : 'text-primary'}`}>
          {selectedFile ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          )}
        </div>
        
        <div className={`text-xl font-medium ${selectedFile ? 'text-green-500' : 'text-primary'}`}>
          {isDragging 
            ? t('dragActive') 
            : selectedFile 
              ? selectedFile.name 
              : t('uploadButton')
          }
        </div>
        
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-500">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadArea;
