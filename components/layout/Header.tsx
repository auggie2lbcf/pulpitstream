import React from "react";
import { cn } from "@/lib/utils"; //
import { createClient } from "@/utils/supabase/server";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Button } from "../ui/button";
import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuLabel } from "../ui/dropdown-menu"; // Assuming you have a menu component
import { ThemeSwitcher } from "../theme-switcher";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";

interface HeaderProps {
  className?: string;
}

export async function Header({ className }: HeaderProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Fallback for missing environment variables
  if (!hasEnvVars) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 lg:px-8",
          className
        )}
      >
        <Link href="/" className="text-lg font-semibold text-foreground">
          PulpitStream
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled
            className="cursor-not-allowed" // More standard disabled cursor
          >
            Sign in
          </Button>
          <Button
            size="sm"
            variant="default"
            disabled
            className="cursor-not-allowed"
          >
            Sign up
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 w-full items-center border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 lg:px-8",
        className
      )}
    >
      {/* Logo/Brand Name */}
      <Link
        href={user ? "/" : "/"} // Or appropriate home link
        className="mr-6 flex items-center space-x-2 text-lg font-semibold text-foreground"
      >
        {/* Optional: Add an SVG logo here */}
        {/* <YourLogoSvg className="h-6 w-6" /> */}
        <span>PulpitStream</span>
      </Link>

      {/* Navigation / Search (if applicable for all states) */}
      {/* Consider moving search to a more central part of the layout if it's always visible */}
      {user && (
        <div className="flex-1">
          {/* Example: Search Input - Use Shadcn UI Input if available */}
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
            />
          </div>
        </div>
      )}

      {/* Spacer to push auth buttons/user menu to the right */}
      {!user && <div className="flex-grow"></div>}


      {/* Auth Buttons / User Menu */}
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        {user && profileData ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={profileData.avatar_url ?? undefined}
                    alt={profileData.username ?? "User"}
                  />
                  <AvatarFallback>
                    {profileData.first_name
                      ? profileData.first_name
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
                    {profileData.username || "User"}
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
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