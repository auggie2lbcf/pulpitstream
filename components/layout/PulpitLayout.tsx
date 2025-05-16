import React from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { MobileNav } from './MobileNav';

interface PulpitLayoutProps {
  children: React.ReactNode;
  showRightPanel?: boolean;
}

export function PulpitLayout({ children, showRightPanel = false }: PulpitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <div className="flex flex-1 relative">
        <LeftSidebar className="hidden md:flex" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}