// app/page.tsx
import { createClient } from '@/utils/supabase/server'; //
import { PodcastCard } from '@/components/PodcastCard'; // Assuming you created this
import type { Tables } from '@/types/supabase'; //

// This tells Next.js to revalidate this page periodically or on demand.
// Adjust the revalidate time as needed, or remove for default behavior.
// export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const supabase = await createClient();

  const { data: podcasts, error } = await supabase
    .from('podcasts')
    .select(`
      podcast_id,
      title,
      podcast_slug,
      image_url,
      itunes_author_name,
      description
    `) // Select only necessary fields
    .order('created_at', { ascending: false }) // Example: order by newest
    .limit(12); // Example: limit the number of podcasts on the homepage

  if (error) {
    console.error('Error fetching podcasts:', error);
    // You could return a more user-friendly error message component here
    return (
      <div className="text-center py-10">
        <p className="text-destructive-foreground bg-destructive p-4 rounded-md"> {/* */}
          Could not fetch podcasts. Please try again later.
        </p>
      </div>
    );
  }

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No podcasts found.</p> {/* */}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6"> {/* */}
        Discover Podcasts
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {podcasts.map((podcast) => (
          // Cast to the correct type if Supabase client doesn't infer it perfectly
          // though with the select string, it should generally be fine for listed props.
          // If you select '*', it aligns perfectly with Tables<'podcasts'>
          <PodcastCard key={podcast.podcast_id} podcast={podcast as Tables<'podcasts'>} />
        ))}
      </div>
    </div>
  );
}