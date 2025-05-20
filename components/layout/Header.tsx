import React from "react";
import { cn } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server"; // Use server-side Supabase client
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Button } from "../ui/button";
import Link from "next/link";
import { signOutAction } from "@/app/actions"; // Assuming signOutAction is a Server Action
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { ThemeSwitcher } from "../theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { SearchBar } from "./SearchBar";

interface HeaderProps {
  className?: string;
}

const UserDropdown = ({ user, profile }: { user: any; profile: any }) => {
  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={profile?.avatar_url ?? undefined}
              alt={profile?.username ?? "User"}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile?.username || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          {/* Use the Server Action directly */}
          <form action={signOutAction} className="w-full">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start px-2 py-1.5 text-sm"
            >
              Sign out
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Header is now an async Server Component to fetch data
export async function Header({ className }: HeaderProps) {
  const supabase = createClient(); // Use server-side client directly

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  const { data: profileData } = user
    ? await (await supabase).from("profiles").select("*").eq("id", user.id).single()
    : { data: null }; // Handle case where there is no user

  const showAuthButtons = !user || !profileData;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 w-full items-center border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 lg:px-8",
        className
      )}
    >
      {/* Brand */}
      <Link
        href="/"
        className="mr-6 flex items-center space-x-2 text-lg font-semibold text-foreground"
      >
        <span>PulpitStream</span>
      </Link>

      
      <SearchBar />

      {/* Push auth buttons/user dropdown to right */}
      {/* This div can help push content, although flex-grow on SearchBar might be sufficient */}
      {/* {!user && <div className="flex-grow" />}  Removed as flex-1 on SearchBar should handle spacing*/}

      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        {hasEnvVars ? (
          showAuthButtons ? (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild size="sm" variant="default">
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </div>
          ) : (
            // Pass the fetched data to the UserDropdown (can be a Server or Client Comp,
            // but if it has client-side logic like the dropdown, it needs "use client")
            // Since shadcn/ui components are used, they are Client Components internally.
            <UserDropdown user={user} profile={profileData} />
          )
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="cursor-not-allowed"
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
        )}
      </div>
    </header>
  );
}
