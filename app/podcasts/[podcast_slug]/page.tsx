// /app/podcasts/[podcast_slug]/page.tsx
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link"; // Import Link
import { notFound } from "next/navigation";


type PodcastEpisodePageProps = Promise<{
    podcast_slug: string;
}>;

export default async function PodcastEpisodesListPage({ params } : { params : PodcastEpisodePageProps }) { // Renamed component for clarity
  const supabase = await createClient();
  const { podcast_slug } = await params;

  // Fetch podcast details (keep this for context)
  const { data: podcast, error: podcastError } = await supabase
    .from("podcasts")
    .select("title, description, image_url")
    .eq("feed_slug", podcast_slug)
    .single();

  // Fetch episodes - select fields needed for the list
  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select("id, title, description, date, episode_num, season_num") // Removed audio_url, duration from select
    .eq("podcast_slug", podcast_slug)
    .order("date", { ascending: false });

  if (podcastError || !podcast) {
    console.error("Error fetching podcast details:", podcastError);
    notFound();
  }

  if (episodesError) {
    console.error("Error fetching episodes:", episodesError);
    // Handle error, maybe show message but still render podcast info
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Podcast Header Section (same as before) */}
      <div className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-border pb-6">
        {podcast.image_url && (
           <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0 rounded-md overflow-hidden shadow-md bg-muted">
              <Image
                 src={podcast.image_url}
                 alt={podcast.title ?? 'Podcast cover art'}
                 layout="fill"
                 objectFit="cover"
              />
            </div>
        )}
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">{podcast.title ?? "Untitled Podcast"}</h1>
          <p className="text-base md:text-lg text-muted-foreground">{podcast.description ?? "No description."}</p>
        </div>
      </div>

      {/* Episodes List Section */}
      <h2 className="text-2xl font-semibold mb-4 text-foreground">Episodes</h2>
      {episodes && episodes.length > 0 ? (
        <div className="space-y-4"> {/* Adjusted spacing */}
          {episodes.map((episode) => (
            // Link wrapping the episode details
            <Link
              href={`/podcasts/${podcast_slug}/${episode.id}`} // Link to the specific episode page
              key={episode.id}
              className="block hover:bg-muted/50 transition-colors duration-150 rounded-lg border border-border p-4 shadow-sm" // Make the whole item clickable and styled
            >
              <div>
                <h3 className="text-lg font-semibold mb-1 text-primary group-hover:underline"> {/* Use primary color, add underline on hover */}
                  {episode.title ?? "Untitled Episode"}
                </h3>
                <div className="text-sm text-muted-foreground mb-2">
                   {/* Display date and season/episode number */}
                  {episode.date ? new Date(episode.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
                  {(episode.season_num || episode.episode_num) && <span className="mx-2">|</span>}
                  {(episode.season_num || episode.episode_num) && `S${episode.season_num ?? '?'} E${episode.episode_num ?? '?'}`}
                </div>
                 {/* Show a snippet of the description */}
                <p className="text-sm text-foreground line-clamp-2">
                  {episode.description ?? ""}
                </p>
                {/* REMOVED AUDIO PLAYER and duration from here */}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No episodes found for this podcast.</p>
      )}
    </div>
  );
}