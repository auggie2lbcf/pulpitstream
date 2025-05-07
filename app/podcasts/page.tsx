// /app/podcasts/page.tsx
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const runtime = "edge";

export default async function PodcastsPage() {
  const supabase = await createClient();
  const { data: podcasts, error } = await supabase
    .from("podcasts")
    .select("podcast_slug, title, description, image_url"); // Select necessary fields

  if (error) {
    console.error("Error fetching podcasts:", error);
    return <p className="text-red-500">Error loading podcasts.</p>; // Add some error styling
  }

  if (!podcasts || podcasts.length === 0) {
    return <p>No podcasts found.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Podcasts</h1>{" "}
      {/* Use theme colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {" "}
        {/* Adjust grid for smaller screens */}
        {podcasts.map((podcast) => (
          <Link href={`/podcasts/${podcast.podcast_slug}`} key={podcast.podcast_slug}>
            {/* Simple Card Structure with Tailwind */}
            <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm overflow-hidden h-full hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col">
              {" "}
              {/* Use theme colors */}
              {podcast.image_url && (
                <div className="relative w-full h-48 flex-shrink-0">
                  {" "}
                  {/* Fixed height for image container */}
                  <Image
                    src={podcast.image_url}
                    alt={podcast.title ?? "Podcast cover art"}
                    layout="fill"
                    objectFit="cover" // Ensures the image covers the container
                    className="bg-muted" // Placeholder background
                  />
                </div>
              )}
              <div className="p-4 flex flex-col flex-grow">
                {" "}
                {/* Padding and flex-grow for content */}
                <h2 className="text-xl font-semibold mb-2 truncate">
                  {" "}
                  {/* Truncate long titles */}
                  {podcast.title ?? "Untitled Podcast"}
                </h2>
                <p className="text-muted-foreground text-sm line-clamp-3 flex-grow">
                  {" "}
                  {/* Use theme colors, smaller text, limit lines */}
                  {podcast.description ?? "No description available."}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
