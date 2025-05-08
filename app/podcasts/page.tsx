// /app/podcasts/page.tsx
import { createClient } from "@/utils/supabase/server";
import { Tables } from "@/types/supabase";
import { PodcastCard } from "@/components/PodcastCard";

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
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6"> {/* */}
        Podcasts
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {podcasts.map((podcast) => (
          <PodcastCard key={podcast.podcast_slug} podcast={podcast as Tables<'podcasts'>} />
        ))}
      </div>
    </div>
  );
}
