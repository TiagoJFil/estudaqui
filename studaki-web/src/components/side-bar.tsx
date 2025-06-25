'use-client';

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import FlexSpacer from "./flex-spacer";

interface SideBarProps {
    isCollapsed: boolean;
    onCollapse?: () => void;
}


const SideBar: React.FC<SideBarProps> = ({isCollapsed, onCollapse}: SideBarProps) => {
  const t = useTranslations();
  return (
    <aside className="w-88 bg-primary rounded-r-4xl">
        {/* Logo - Title - collapse button */}
        <div className="w-full h-16 flex items-center px-4">
            <img src="/icon_no_bg.png" className="scale-30" />
            <h2 className="text-4xl font-logo text-white uppercase">{t("General.branding")}</h2>
            <FlexSpacer />
            <button className="text-white hover:text-gray-300 transition-colors" onClick={onCollapse}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"></path>
                </svg>
            </button>
        </div>
    </aside>
  )
  
};

export default SideBar;