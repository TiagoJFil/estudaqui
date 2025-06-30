"use client";
import React from 'react';
import { useTranslations } from 'next-intl';

interface CreditsDisplayProps {
  credits: number;
  onBuyMore: () => void;
  onMenuClick?: () => void;
}

const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ 
  credits, 
  onBuyMore,
  onMenuClick 
}) => {
  const t = useTranslations('General');

  return (
    <div className="flex items-center gap-3">
      <div className="text-xl font-medium">
        {t('credits')} : {credits}
      </div>
      <button 
        className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded-full transition-colors"
        onClick={onBuyMore}
      >
        {t('buyMore')}
      </button>
      {onMenuClick && (
        <button 
          className="p-1 text-gray-700 hover:text-gray-900 transition-colors"
          onClick={onMenuClick}
          aria-label={t('menu')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default CreditsDisplay;
