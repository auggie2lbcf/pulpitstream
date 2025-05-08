// app/components/layout/Header.tsx
import React from "react";
import { cn } from "@/lib/utils"; //
import { createClient } from "@/utils/supabase/server";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Button } from "../ui/button";
import Link from "next/link";
import { signOutAction } from "@/app/actions";

interface HeaderProps {
  className?: string;
}

export async function Header({ className }: HeaderProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <header
      className={cn(
        "sticky top-0 z-50 h-14 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", //
        "flex items-center justify-between px-4 shadow-sm",
        className
      )}
    >
      <div className="text-lg font-semibold text-foreground">PulpitStream</div>{" "}
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search"
          className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-[100px] lg:w-[300px]"
        />
        {user.user_metadata.display_name}
        <form action={signOutAction}>
          <Button type="submit" variant={"outline"}>
            Sign out
          </Button>
        </form>
      </div>
    </header>
  ) : (
    <header
      className={cn(
        "sticky top-0 z-50 h-14 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", //
        "flex items-center justify-between px-4 shadow-sm",
        className
      )}
    >
      <div className="text-lg font-semibold text-foreground">PulpitStream</div>{" "}
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    </header>
  );
}
