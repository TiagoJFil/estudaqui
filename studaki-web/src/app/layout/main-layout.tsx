'use client';
import { useState, useEffect } from 'react';
import SideBar from '@/components/side-bar';
 
export default function MainLayout({children}: {children: React.ReactNode;}) {
  // Initialize with a default value, will be updated from localStorage on mount
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Load the sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
    
    // Handle responsive layout for mobile - collapse sidebar on small screens by default
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        setIsCollapsed(true);
        localStorage.setItem('sidebarCollapsed', 'true');
      }
    };
    
    // Check on mount
    handleResize();
    
    // Add event listener for window resize
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    // Save to localStorage
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  return (
    <main className='flex h-screen overflow-hidden bg-background'>
      <SideBar isCollapsed={isCollapsed} onCollapse={toggleSidebar}/>
      <div 
        className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-16' : 'ml-72'
        }`}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </main>
  );
}