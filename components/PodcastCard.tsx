// app/components/PodcastCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/utils/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// We will define a specific type for the card data instead of using the full Tables type
// import type { Tables } from '@/types/supabase'; // <-- Remove this import

// Define the minimum data required by the PodcastCard component
interface PodcastCardData {
  podcast_id: string; // Used for the key
  podcast_slug: string; // Used for the link href
  title: string | null;
  description: string | null;
  image_url: string; // Assuming image_url is always present based on your schema
  itunes_author_name: string | null;
  // Add any other fields actively used by the card if necessary
}

interface PodcastCardProps {
  // Use the new specific type here
  podcast: PodcastCardData;
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
            {/* Ensure image_url is not null before passing to Image */}
            {image_url && (
                <Image
                    src={image_url}
                    alt={`Cover art for ${title || "Untitled Podcast"}`}
                    fill
                    className="transition-transform duration-300 group-hover:scale-105"
                    // Add sizes prop for better performance
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                />
            )}
            {/* Fallback if no image_url */}
            {!image_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                  No Image
                </div>
            )}
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