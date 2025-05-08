import { LucideHome, LucidePodcast, LucideStar, LucideUser } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border h-14 flex items-center justify-around px-4">
      <Link href="/" className="flex flex-col items-center">
        <LucideHome size={20} />
        <span className="text-xs">Home</span>
      </Link>
      <Link href="/podcasts" className="flex flex-col items-center">
        <LucidePodcast size={20} />
        <span className="text-xs">Podcasts</span>
      </Link>
      <Link href="/favorites" className="flex flex-col items-center">
        <LucideStar size={20} />
        <span className="text-xs">Favorites</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center">
        <LucideUser size={20} />
        <span className="text-xs">Profile</span>
      </Link>
    </nav>
  );
}