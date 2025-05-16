"use client";

import React, { useState } from "react";
import { cn } from "@/utils/utils";
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

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, label, collapsed }) => (
  <Link
    href={href}
    className={cn(
      "p-2 flex items-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
      collapsed ? "justify-center" : "justify-start"
    )}
  >
    <span className={cn("flex items-center", collapsed && "mx-auto")}>
      {icon}
      {!collapsed && <span className="ml-2">{label}</span>}
    </span>
  </Link>
);

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-14 border-r border-border bg-background transition-all duration-100 ease-in-out",
        isCollapsed ? "w-16" : "w-[240px]",
        "p-2 flex flex-col",
        className
      )}
      aria-label="Sidebar"
    >
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="mb-4 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors hidden md:flex items-center justify-between"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="mx-auto" /> : <>
          <span>Collapse</span>
          <ChevronLeft />
        </>}
      </button>

      <nav className="flex flex-col space-y-2">
        <SidebarItem
          href="/"
          icon={<LucideHome size={24} />}
          label="Home"
          collapsed={isCollapsed}
        />
        <SidebarItem
          href="/podcasts"
          icon={<LucidePodcast size={24} />}
          label="Podcasts"
          collapsed={isCollapsed}
        />
        <SidebarItem
          href="/favorites"
          icon={<LucideStar size={24} />}
          label="Favorites"
          collapsed={isCollapsed}
        />
        <SidebarItem
          href="/profile"
          icon={<LucideUser size={24} />}
          label="Profile"
          collapsed={isCollapsed}
        />
      </nav>
    </aside>
  );
}
