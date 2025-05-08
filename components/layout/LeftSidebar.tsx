// app/components/layout/LeftSidebar.tsx
"use client"; // If you add interactivity like collapse button

import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react'; //

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-[calc(100vh-3.5rem)] sticky top-14 border-r border-border bg-background transition-all duration-300 ease-in-out", //
        isCollapsed ? "w-16" : "w-64",
        "p-4 flex flex-col",
        className
      )}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-4 self-end rounded-md p-1 text-foreground hover:bg-accent" //
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <nav className="flex flex-col space-y-2">
        {/* Navigation items will go here */}
        <a href="/" className={cn("p-2 rounded-md hover:bg-accent hover:text-accent-foreground", isCollapsed && "justify-center")}> {/* */}
          {isCollapsed ? "🏠" : "Home"}
        </a>
        <a href="/podcasts" className={cn("p-2 rounded-md hover:bg-accent hover:text-accent-foreground", isCollapsed && "justify-center")}>
          {isCollapsed ? "🎙️" : "Podcasts"}
        </a>
        <a href="/following" className={cn("p-2 rounded-md hover:bg-accent hover:text-accent-foreground", isCollapsed && "justify-center")}>
          {isCollapsed ? "⭐" : "Following"}
        </a>
        <a href="/profile" className={cn("p-2 rounded-md hover:bg-accent hover:text-accent-foreground", isCollapsed && "justify-center")}>
          {isCollapsed ? "P" : "Profile"}
        </a>
      </nav>
    </aside>
  );
}