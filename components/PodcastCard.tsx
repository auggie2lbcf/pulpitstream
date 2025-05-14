// app/components/PodcastCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Tables } from '@/types/supabase';

interface PodcastCardProps {
  podcast: Tables<'podcasts'>;
  className?: string;
}

export function PodcastCard({ podcast, className }: PodcastCardProps) {
  const {
    title,
    image_url,
    itunes_author_name,
    podcast_slug,
    description,
  } = podcast;

  const author = itunes_author_name || "Unknown Author";
  const podcastLink = `/podcasts/${podcast_slug}`;

  return (
    <Link href={podcastLink} passHref>
      {/* Use group class for hover effects on children, adjust width for responsiveness if needed by parent grid/flex */}
      <Card className={cn(
        "bg-card text-card-foreground border-border w-full overflow-hidden h-full flex flex-col group hover:border-primary transition-colors duration-150",
        className // Allows overriding/adding classes from parent
      )}>
        {/* Image Container: Use aspect ratio and w-full for responsive image scaling */}
        <div className="relative aspect-square overflow-hidden"> {/* Added overflow-hidden */}
          <Image
            src={image_url || "/image.png"}
            alt={`Cover art for ${title}`}
            fill
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardHeader className="p-3 flex-grow">
          {/* Title: Responsive text size and truncation */}
          <CardTitle className="text-base md:text-lg font-semibold truncate text-foreground group-hover:text-primary transition-colors duration-150">
            {title || "Untitled Podcast"}
          </CardTitle>
          {/* Author: Smaller text on small screens */}
          <CardDescription className="text-xs md:text-sm text-muted-foreground truncate mt-1">
            {author}
          </CardDescription>
          {/* Description: Limit lines responsively if needed, though line-clamp is generally sufficient */}
          {description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {description}
            </p>
          )}
        </CardHeader>
        {/* CardContent or CardFooter can be added here if needed */}
      </Card>
    </Link>
  );
}