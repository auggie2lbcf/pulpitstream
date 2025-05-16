// app/components/layout/Header.tsx
"use client"; // Make this a client component

import React, { useState, FormEvent } from "react";
import { cn } from "@/utils/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuLabel } from "../ui/dropdown-menu";
import { ThemeSwitcher } from "../theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { useUser } from "@/utils/hooks/useUser"; // Assuming you have a useUser hook

interface HeaderProps {
  className?: string;
}

// Since Header is client, we need to fetch user on client or pass down
// For simplicity and demonstration, let's assume a client-side hook or context for user
// If not using a hook, you would pass user data from a server component wrapping this.

export function Header({ className }: HeaderProps) {
  const router = useRouter();
  const { user, profile } = useUser(); // Use a client hook to get user and profile
  const [searchQuery, setSearchQuery] = useState(""); // State for search input

  // Function to handle search form submission
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to the search results page with the query parameter
      router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Fallback for missing environment variables (consider handling this differently in client)
  // This check might need to be done server-side before rendering the client component
  // For now, let's assume env vars are available client-side for simplicity or handle gracefully.
  // if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  //    // Render a degraded state or warning
  //    return (...existing fallback JSX...)
  // }


  return (
      <header
          className={cn(
              "sticky top-0 z-50 flex h-16 w-full items-center border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 lg:px-8",
              className
          )}
      >
        {/* Logo/Brand Name */}
        <Link
            href="/" // Link to the main home page
            className="mr-6 flex items-center space-x-2 text-lg font-semibold text-foreground"
        >
          {/* Optional: Add an SVG logo here */}
          {/* <YourLogoSvg className="h-6 w-6" /> */}
          <span>PulpitStream</span>
        </Link>

        {/* Navigation / Search (if applicable for all states) */}
        {/* Consider moving search to a more central part of the layout if it's always visible */}
        {/* Wrap the search input in a form */}
        <form onSubmit={handleSearch} className="flex-1">
          {user && ( // Only show search if user is logged in
              <div className="relative w-full max-w-md lg:max-w-lg">
                <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <Input
                    type="search"
                    placeholder="Search features, content..."
                    className="h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={searchQuery} // Controlled component
                    onChange={(e) => setSearchQuery(e.target.value)} // Update state on change
                />
              </div>
          )}
        </form>

        {/* Spacer to push auth buttons/user menu to the right */}
        {!user && <div className="flex-grow"></div>}

        {/* Auth Buttons / User Menu */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          {user && profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                          src={profile.avatar_url ?? undefined}
                          alt={profile.username ?? "User"}
                      />
                      <AvatarFallback>
                        {profile.full_name
                            ? profile.full_name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                            : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile.username || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* Add other user menu items here */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    {/* Use a button inside the form for sign out */}
                    <form action={signOutAction} className="w-full">
                      <Button
                          type="submit"
                          variant="ghost"
                          className="w-full cursor-pointer justify-start px-2 py-1.5 text-sm"
                      >
                        Sign out
                      </Button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="default">
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </div>
          )}
        </div>
      </header>
  );
}