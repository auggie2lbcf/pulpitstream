// app/components/PodcastCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { cn } from "@/lib/utils"; //
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // From shadcn/ui
import type { Tables } from '@/types/supabase'; //

interface PodcastCardProps {
  podcast: Tables<'podcasts'>; // Use the generated type for a podcast row
  className?: string;
}

export function PodcastCard({ podcast, className }: PodcastCardProps) {
  const {
    title,
    image_url, //
    itunes_author_name, //
    podcast_slug, //
    description,
  } = podcast;

  const author = itunes_author_name || "Unknown Author";
  const podcastLink = `/podcasts/${podcast_slug}`; //

  return (
    <Link href={podcastLink} passHref>
        <Card className="bg-card text-card-foreground border-border w-full overflow-hidden h-full flex flex-col group-hover:border-primary transition-colors duration-150"> {/* */}
          <div className="relative aspect-video w-full">
            <Image
              src={image_url || "/image.png"} // Provide a fallback image
              alt={`Cover art for ${title}`}
              width={300}
              height={300}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <CardHeader className="p-3 flex-grow">
            <CardTitle className="text-base font-semibold truncate text-foreground group-hover:text-primary transition-colors duration-150"> {/* */}
              {title || "Untitled Podcast"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground truncate mt-1"> {/* */}
              {author}
            </CardDescription>
            {description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {description}
              </p>
            )}
          </CardHeader>
          {/* You can add more details or actions in CardContent or CardFooter if needed */}
          {/* <CardContent className="p-3 pt-0">
            tags or other info
          </CardContent> */}
        </Card>
    </Link>
  );
}