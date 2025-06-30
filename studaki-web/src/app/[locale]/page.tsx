"use client";
import {useTranslations} from 'next-intl';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import CreditsDisplay from '@/components/credits-display';
import LoadingSpinner from '@/components/ui/loading-spinner';

// Use dynamic import to avoid SSR issues with browser-specific code
const FileUploadArea = dynamic(
  () => import('@/components/ui/file-upload-area'),
  { ssr: false }
);

export default function HomePage() {
  const t = useTranslations('HomePage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Handle file upload
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    // Here you would typically prepare the file for processing
  };
  
  // Handle the process button click
  const handleProcessFile = () => {
    if (selectedFile) {
      setIsProcessing(true);
      // Simulate processing - in a real app this would be an API call
      setTimeout(() => {
        setIsProcessing(false);
        // Navigate to results page or show results
      }, 2000);
    }
  };
  
  // Handle buy more credits
  const handleBuyMore = () => {
    console.log('Buy more credits');
    // Navigate to credits purchase page or open modal
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Credits display - visible on mobile and desktop */}
      <div className="fixed top-6 right-6 z-10">
        <CreditsDisplay 
          credits={7} 
          onBuyMore={handleBuyMore}
          onMenuClick={() => console.log('Menu clicked')}
        />
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-20 md:py-24 max-w-4xl flex-grow flex flex-col justify-center">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h1>
          <p className="text-base sm:text-lg mb-2">
            {t('subtitle')}
          </p>
          <p className="text-base sm:text-lg mb-8 md:mb-10">
            {t('description')}
          </p>
          
          {/* Upload box */}
          <div className="border-2 border-gray-300 border-dashed rounded-lg p-4 sm:p-6 mb-6">
            <FileUploadArea onFileSelected={handleFileSelected} />
            
            {/* Process button */}
            <button 
              className={`bg-primary hover:bg-primary/90 text-white font-medium py-2.5 sm:py-3 px-8 sm:px-10 rounded-full text-base sm:text-lg transition-colors inline-flex items-center justify-center ${
                (!selectedFile || isProcessing) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              onClick={handleProcessFile}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">{t('processing')}</span>
                </>
              ) : (
                t('processButton')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}