// app/components/layout/LeftSidebar.tsx
"use client"; // If you add interactivity like collapse button

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LucideHome,
  LucidePodcast,
  LucideStar,
  LucideUser,
} from "lucide-react";
import Link from "next/link";

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-[calc(100vh-3.5rem)] sticky top-14 border-r border-border bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-[240px]", // Slightly smaller width
        "p-2 flex flex-col",
        className
      )}
    >
      {/* Collapse button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "mb-4 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-300 ease-in-out",
          "hidden md:flex" // Hide on mobile
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="mx-auto" />
        ) : (
          <div className="flex w-full items-center justify-between">
            <span>Collapse</span>
            <ChevronLeft />
          </div>
        )}
      </button>

      {/* Navigation */}
      <nav className="flex flex-col space-y-2">
        {/* Navigation items */}
        <Link
          href="/"
          className={cn(
            "p-2 rounded-md hover:bg-accent hover:text-accent-accent-foreground transition-all duration-300 ease-in-out",
            isCollapsed && "justify-center"
          )}
        >
          <div className={cn("flex")}>
            {isCollapsed ? (
              <div className={cn("mx-auto")}>
                <LucideHome size={24} />
              </div>
            ) : (
              <>
                <LucideHome size={24} /> <p className={cn("ml-2")}>Home</p>
              </>
            )}
          </div>
        </Link>
        <Link
          href="/podcasts"
          className={cn(
            "p-2 rounded-md hover:bg-accent hover:text-accent-accent-foreground transition-all duration-300 ease-in-out",
            isCollapsed && "justify-center"
          )}
        >
          <div className={cn("flex")}>
            {isCollapsed ? (
              <div className={cn("mx-auto")}>
                <LucidePodcast size={24} />
              </div>
            ) : (
              <>
                <LucidePodcast size={24} />{" "}
                <p className={cn("ml-2")}>Podcasts</p>
              </>
            )}
          </div>
        </Link>
        <Link
          href="/favorites"
          className={cn(
            "p-2 rounded-md hover:bg-accent hover:text-accent-accent-foreground transition-all duration-300 ease-in-out",
            isCollapsed && "justify-center"
          )}
        >
          <div className={cn("flex")}>
            {isCollapsed ? (
              <div className={cn("mx-auto")}>
                <LucideStar size={24} />
              </div>
            ) : (
              <>
                <LucideStar size={24} /> <p className={cn("ml-2")}>Podcasts</p>
              </>
            )}
          </div>
        </Link>
        <Link
          href="/user"
          className={cn(
            "p-2 rounded-md hover:bg-accent hover:text-accent-accent-foreground transition-all duration-300 ease-in-out",
            isCollapsed && "justify-center"
          )}
        >
          <div className={cn("flex")}>
            {isCollapsed ? (
              <div className={cn("mx-auto")}>
                <LucideUser size={24} />
              </div>
            ) : (
              <>
                <LucideUser size={24} /> <p className={cn("ml-2")}>Podcasts</p>
              </>
            )}
          </div>
        </Link>
      </nav>
    </aside>
  );
}
