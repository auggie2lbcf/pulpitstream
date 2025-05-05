// /app/podcasts/[podcast_slug]/[episode_id]/page.tsx
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Database } from "@/types/supabase"; // Import Database type

type EpisodePlayerPageProps = {
  params: {
    podcast_slug: string;
    episode_id: string; // Episode ID will be a string from the URL
  };

  searchParams?: { [key: string]: string | string[] | undefined };
};

// Define type for the joined query result
type EpisodeWithPodcast = Database['public']['Tables']['episodes']['Row'] & {
    podcasts: Pick<Database['public']['Tables']['podcasts']['Row'], 'title' | 'image_url'> | null;
  };


  export default async function EpisodePlayerPage({ params }: EpisodePlayerPageProps) {
    const supabase = await createClient();
    const { podcast_slug, episode_id } = params;

  // Validate episode_id is a number before querying
  const episodeIdNumber = parseInt(episode_id, 10);
  if (isNaN(episodeIdNumber)) {
      console.error("Invalid episode ID:", episode_id);
      notFound();
  }

  // Fetch the specific episode and include podcast title/image for context
  // Using a join for efficiency
  const { data: episode, error } = await supabase
    .from("episodes")
    .select(`
      *,
      podcasts ( title, image_url )
    `)
    .eq("id", episodeIdNumber) // Use the numeric ID
    .eq("podcast_slug", podcast_slug) // Ensure it belongs to the correct podcast slug
    .single<EpisodeWithPodcast>(); // Get a single result and apply the type


  if (error || !episode) {
    console.error("Error fetching episode:", error);
    notFound(); // Show 404 if episode not found or doesn't match slug
  }

  // Extract podcast info from the joined data
  const podcastInfo = episode.podcasts;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl"> {/* Limit width for readability */}

        {/* Optional: Breadcrumb or link back to podcast */}
        {podcastInfo && (
             <div className="mb-4 text-sm text-muted-foreground">
                 <Link href={`/podcasts/${podcast_slug}`} className="hover:underline">
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
                      layout="fill"
                      objectFit="cover"
                   />
                 </div>
           )}
           <div className="flex-grow text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">{episode.title ?? "Untitled Episode"}</h1>
             <p className="text-base text-muted-foreground mb-2">
               From: <Link href={`/podcasts/${podcast_slug}`} className="hover:underline font-medium">{podcastInfo?.title ?? 'Podcast'}</Link>
             </p>
            <p className="text-sm text-muted-foreground">
                {episode.date ? new Date(episode.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ""}
                {episode.duration && <span className="mx-2">|</span>}
                {episode.duration && `Duration: ${episode.duration}`}
                 {(episode.season_num || episode.episode_num) && <span className="mx-2">|</span>}
                 {(episode.season_num || episode.episode_num) && `S${episode.season_num ?? '?'} E${episode.episode_num ?? '?'}`}
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
         {episode.passage && <p className="mt-4"><strong>Passage:</strong> {episode.passage}</p>}
      </div>

    </div>
  );
}

// Optional: Generate static paths if you have a predictable set of episodes
// export async function generateStaticParams() {
//    const supabase = await createClient();
//    const { data: episodes } = await supabase.from('episodes').select('id, podcast_slug');
//    return episodes?.map(({ id, podcast_slug }) => ({
//      podcast_slug: podcast_slug,
//      episode_id: id.toString(), // Ensure ID is a string for params
//    })) || [];
// }