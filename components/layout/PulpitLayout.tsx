// app/components/layout/PulpitLayout.tsx
import React from 'react';
import { Header } from './Header';
import { LeftSidebar } from './LeftSidebar';
import { cn } from '@/lib/utils';

interface PulpitLayoutProps {
  children: React.ReactNode;
  showRightPanel?: boolean; // Prop to conditionally show the right panel
}

export function PulpitLayout({ children, showRightPanel = false }: PulpitLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground"> {/* */}
      <Header />
      <div className="flex flex-1">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}