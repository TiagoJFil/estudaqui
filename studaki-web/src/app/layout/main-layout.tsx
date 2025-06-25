'use client';
import { useState } from 'react';
import SideBar from '@/components/side-bar';
 
export default function MainLayout({children}: {children: React.ReactNode;}) {

    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    return (
        <main className='flex h-screen'>
            <SideBar isCollapsed={false} onCollapse={() => console.log("Collapse clicked")}/>
            {children}
        </main>
    );
}