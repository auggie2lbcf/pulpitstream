// /app/podcasts/[podcast_slug]/[episode_id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Database } from "@/types/supabase"; // Import Database type

export const runtime = 'edge';

type EpisodePlayerPageProps = Promise<{
  podcast_slug: string;
  guid: string;
}>;

export default async function EpisodePlayerPage({ params }: {params: EpisodePlayerPageProps }) {
  const { podcast_slug, guid } = await params;
  
  const supabase = await createClient();

  // Fetch the specific episode and include podcast title/image for context
  const { data: episode, error } = await supabase
    .from("episodes")
    .select(`
      *,
      podcasts ( title, image_url )
    `)
    .eq("guid", guid)
    .eq("podcast_slug", podcast_slug)
    .single();

  if (error || !episode) {
    console.error("Error fetching episode:", error);
    console.error("Episode not found for guid:", guid);
    console.error("Podcast slug:", podcast_slug);
    notFound();
  }

  // Extract podcast info from the joined data
  const podcastInfo = episode.podcasts;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl"> {/* Limit width for readability */}
      {/* Optional: Breadcrumb or link back to podcast */}
      {podcastInfo && (
           <div className="mb-4 text-sm text-muted-foreground">
               <Link
                 href={`/podcasts/${podcast_slug}`}
                 className="hover:underline"
                 legacyBehavior>
                   Back to {podcastInfo.title ?? 'Podcast'} Episodes
               </Link>
           </div>
      )}
      {/* Episode Header */}
      <div className="mb-6 p-6 bg-card text-card-foreground rounded-lg border border-border shadow-sm flex flex-col sm:flex-row items-center gap-6">
          {podcastInfo?.image_url && (
               <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                  <Image
                    src={podcastInfo.image_url}
                    alt={podcastInfo.title ?? 'Podcast cover art'}
                    fill
                    sizes="100vw"
                    style={{
                      objectFit: "cover"
                    }} />
                </div>
          )}
          <div className="flex-grow text-center sm:text-left">
           <h1 className="text-2xl sm:text-3xl font-bold mb-1">{episode.title ?? "Untitled Episode"}</h1>
            <p className="text-base text-muted-foreground mb-2">
              From: <Link
              href={`/podcasts/${podcast_slug}`}
              className="hover:underline font-medium"
              legacyBehavior>{podcastInfo?.title ?? 'Podcast'}</Link>
            </p>
          </div>
     </div>
      {/* Audio Player */}
      {episode.audio_url ? (
        <div className="mb-6 sticky top-0 bg-background py-4 z-10 border-b border-border"> {/* Make player sticky */}
          <audio controls preload="metadata" className="w-full">
            <source src={episode.audio_url} type="audio/mpeg" /> {/* Adjust type if needed */}
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : (
         <p className="text-center text-muted-foreground my-6">No audio available for this episode.</p>
      )}
      {/* Episode Description/Notes */}
      <div className="prose dark:prose-invert max-w-none text-foreground"> {/* Basic prose styling for description */}
         <h2 className="text-xl font-semibold mb-3">Episode Details</h2>
         {/* You might want to use a library to render markdown if description contains it */}
         <p>{episode.description ?? "No details available."}</p>
         {/* Add other details like passage if available */}
         {/* {episode.passage && <p className="mt-4"><strong>Passage:</strong> {episode.passage}</p>} */}
      </div>
    </div>
  );
}