"use client";

import { useTranslations } from "next-intl";
import React from "react";
import FlexSpacer from "./ui/flex-spacer";
import RecentFile from "./RecentFile";
import ChevronIcon from "./icons/ChevronIcon";
import PlusIcon from "./icons/PlusIcon";
import SearchIcon from "./icons/SearchIcon";
import UserIcon from "./icons/UserIcon";
import Tooltip from "./Tooltip";

// ========================================
// Types and Interfaces
// ========================================
interface SideBarProps {
  isCollapsed: boolean;
  onCollapse?: () => void;
}

/**
 * SideBar Component
 *
 * A responsive sidebar that can be collapsed or expanded.
 * Shows icons only when collapsed, and full labels when expanded.
 */
const SideBar: React.FC<SideBarProps> = ({ isCollapsed, onCollapse }: SideBarProps) => {
  const t = useTranslations("SideBar");
  const tGeneral = useTranslations("General");

  // ========================================
  // Render Helper Functions
  // ========================================

  /**
   * Renders the header section with logo and collapse/expand controls
   */
  const renderHeader = () => (
    <div
      className="flex items-center w-full border-b border-white/10 transition-all duration-300"
      style={{ height: 80 }}
    >
      {/* Logo container - fixed width in both states */}
      <div className="flex items-center justify-start pl-6 h-full w-16">
        <img
          src="/icon_no_bg.png"
          className="object-contain w-8 h-8"
          alt="Logo"
        />
      </div>
      
      {/* Title - only visible when expanded */}
      <div className="flex-1 flex items-center min-w-0 overflow-hidden transition-opacity duration-300"
           style={{ opacity: isCollapsed ? 0 : 1, maxWidth: isCollapsed ? 0 : '100%' }}>
        <h2 className="text-2xl font-logo text-white uppercase whitespace-nowrap overflow-hidden">
          {tGeneral("branding")}
        </h2>
      </div>
      
      {/* Chevron button - always in the same position */}
      <div className="pr-6 flex items-center justify-end w-14 h-full">
        <button
          className="w-10 h-10 flex items-center justify-center text-white hover:text-gray-300 focus:outline-none cursor-pointer"
          onClick={onCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronIcon direction={isCollapsed ? "right" : "left"} />
        </button>
      </div>
    </div>
  );

  /**
   * Renders the main action buttons (upload, search)
   */
  const renderActions = () => (
    <div className="space-y-4 w-full">
      {/* Upload Button - always left aligned */}
      <div className="w-full">
        <div className="h-10 flex items-center">
          {/* Icon is always visible and in the same position */}
          <div className="flex items-center justify-center w-10 h-10">
            <button
              className={`flex items-center justify-center text-white ${isCollapsed ? "bg-white/10 hover:bg-white/20 rounded-md w-10 h-10" : "bg-transparent"} cursor-pointer`}
              aria-label={t("upload")}
            >
              <PlusIcon width={18} height={18} />
            </button>
          </div>
          
          {/* Label - only visible when expanded */}
          <div 
            className="ml-2 transition-opacity duration-300 overflow-hidden whitespace-nowrap"
            style={{ opacity: isCollapsed ? 0 : 1, maxWidth: isCollapsed ? 0 : '100%', width: isCollapsed ? 0 : 'auto' }}
          >
            <span className="text-white">{t("upload")}</span>
          </div>
          
          {/* Tooltip - only visible when collapsed */}
          {isCollapsed && (
            <Tooltip text={t("upload")} position="right">
              <span className="sr-only">{t("upload")}</span>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="w-full">
        <div className="h-10 flex items-center">
          {/* Icon container - always visible */}
          <div className="flex items-center justify-center w-10 h-10">
            {isCollapsed ? (
              <button
                className="flex items-center justify-center text-white bg-white/5 hover:bg-white/10 rounded-md w-10 h-10 transition-colors cursor-pointer"
                aria-label={t("examSearch")}
              >
                <SearchIcon width={18} height={18} />
                <Tooltip text={t("examSearch")} position="right">
                  <span className="sr-only">{t("examSearch")}</span>
                </Tooltip>
              </button>
            ) : (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="text-white/50" width={18} height={18} />
              </div>
            )}
          </div>
          
          {/* Input - only visible when expanded */}
          <div 
            className="transition-all duration-300 w-full ml-2 overflow-hidden"
            style={{ opacity: isCollapsed ? 0 : 1, maxWidth: isCollapsed ? 0 : '100%', width: isCollapsed ? 0 : '100%' }}
          >
            {!isCollapsed && (
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder={t("examSearch")}
                  className="bg-white/5 text-white w-full py-2 pl-8 rounded-md focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors"
                  style={{ paddingLeft: "2.5rem" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Renders the recent files section (only visible when expanded)
   */
  const renderRecentFiles = () => (
    <div 
      className="mt-6 w-full overflow-hidden transition-all duration-300"
      style={{ opacity: isCollapsed ? 0 : 1, maxHeight: isCollapsed ? 0 : '200px', visibility: isCollapsed ? 'hidden' : 'visible' }}
    >
      <h3 className="text-white/70 uppercase text-xs font-semibold tracking-wider mb-2">
        {t("recentUploads")}
      </h3>
      <div className="space-y-1">
        <RecentFile filename="exam1.pdf" onDelete={() => console.log('Delete exam1.pdf')} />
        <RecentFile filename="exam2.pdf" onDelete={() => console.log('Delete exam2.pdf')} />
        <RecentFile filename="exam3.pdf" onDelete={() => console.log('Delete exam3.pdf')} />
        <RecentFile filename="exam4.pdf" onDelete={() => console.log('Delete exam4.pdf')} />
      </div>
    </div>
  );

  /**
   * Renders the footer navigation items with consistent left alignment
   */
  const renderFooterNav = () => {
    // Footer items that appear in both collapsed and expanded states
    const footerItems = [
      { icon: "?", label: t("help"), tooltip: t("help") },
      { icon: "i", label: t("information"), tooltip: t("information") },
      { 
        icon: <UserIcon width={18} height={18} />, 
        label: "Utilizador123", 
        tooltip: "Utilizador123" 
      }
    ];

    return (
      <div className="w-full space-y-2">
        {footerItems.map((item, index) => (
          <div key={index} className="w-full flex items-center h-10">
            {/* Icon container - always visible and fixed width */}
            <div className="flex items-center justify-center w-10 h-10">
              <button
                className={`text-white/70 hover:text-white flex items-center justify-center ${isCollapsed ? "w-8 h-8 rounded-full" : ""} hover:bg-white/10 transition-colors cursor-pointer`}
                aria-label={typeof item.label === 'string' ? item.label : 'Menu item'}
              >
                {item.icon}
              </button>
              {/* Show tooltip only in collapsed state */}
              {isCollapsed && (
                <Tooltip text={item.tooltip} position="right">
                  <span className="sr-only">{item.tooltip}</span>
                </Tooltip>
              )}
            </div>
            
            {/* Label - only visible when expanded */}
            <div 
              className="ml-2 transition-opacity duration-300 whitespace-nowrap overflow-hidden"
              style={{ opacity: isCollapsed ? 0 : 1, maxWidth: isCollapsed ? 0 : '100%', width: isCollapsed ? 0 : 'auto' }}
            >
              <span className="text-white/70">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ========================================
  // Main Render
  // ========================================
  return (
    <aside
      className="bg-primary rounded-r-2xl text-white transition-all duration-300 flex flex-col h-screen"
      style={{ 
        width: isCollapsed ? '4rem' : '18rem', 
        minWidth: isCollapsed ? '4rem' : '18rem',
        maxWidth: isCollapsed ? '4rem' : '18rem'
      }}
    >
      {/* Logo and Header Section */}
      {renderHeader()}

      {/* Content Area - Actions and Recent Files */}
      <div className="py-6 flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 flex flex-col items-start px-4">
        {renderActions()}
        {renderRecentFiles()}
      </div>

      {/* Footer Navigation */}
      <div className="mt-auto py-4 border-t border-white/10 transition-all duration-300 px-4">
        {renderFooterNav()}
      </div>
    </aside>
  );
};

export default SideBar;