import Hero from "@/components/hero";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "./actions";
import { InfoIcon } from "lucide-react";


export const runtime = 'edge';

export default async function Home() {
  const supabase = await createClient();
  
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      
    }

  return user ? (
    <>
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          protected home page
          <Link href="/protected">/protected</Link>
        </div>
      </div>
      <Hero />
    </>
    ) : (
      <>
        <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          unprotected home page
        </div>
      </div>
        <Hero />
      </>
  );
}
