// app/favorites/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PodcastCard } from "@/components/PodcastCard";
// No need to import Tables anymore for casting
// import { Tables } from "@/types/supabase";

export const runtime = 'edge';

// Define the minimum data required by the PodcastCard component.
interface PodcastCardData {
    podcast_id: string;
    podcast_slug: string;
    title: string | null;
    description: string | null;
    image_url: string; // Assuming image_url is always present based on your schema
    itunes_author_name: string | null;
    // Include any other fields selected in the query needed by PodcastCard
}

// Define a type for the structure of data fetched from the 'followed' table with the joined 'podcasts' data.
interface FollowedItemWithPodcast {
    podcast_slug: string; // From the 'followed' table
    podcasts: PodcastCardData | null; // Joined data from 'podcasts'
}


export default async function FavoritesPage() {
    const supabase = await createClient();

    // Fetch the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // If no user is logged in, redirect to the sign-in page
    if (!user) {
        redirect("/sign-in");
    }

    // Fetch the 'followed' entries for the current user
    // Rely on type inference for the initial query result
    const { data, error } = await supabase
        .from('followed')
        .select( // No generic type here
            `
      podcast_slug,
      podcasts (
        podcast_id,
        podcast_slug,
        title,
        description,
        image_url,
        itunes_author_name
      )
    `
        )
        .eq('id', user.id);


    // Explicitly type the fetched data after the query
    const followedPodcasts = data as FollowedItemWithPodcast[] | null;


    if (error) {
        console.error("Error fetching followed podcasts:", error);
        return (
            <div className="text-center py-10">
                <p className="text-destructive-foreground bg-destructive p-4 rounded-md">
                    Could not fetch your followed podcasts. Please try again later.
                </p>
            </div>
        );
    }

    // Extract the podcast objects from the joined data
    // Handle the case where followedPodcasts is null or undefined before mapping
    const podcasts: PodcastCardData[] | null = followedPodcasts
        ? followedPodcasts // If followedPodcasts is not null/undefined, proceed with map and filter
            .map(item => item.podcasts)
            .filter((podcast): podcast is PodcastCardData => podcast !== null)
        : null; // If followedPodcasts is null/undefined, set podcasts to null


    if (!podcasts || podcasts.length === 0) {
        return (
            <div className="text-center py-10">
                <h1 className="text-3xl font-bold text-foreground mb-4">Your Followed Podcasts</h1>
                <p className="text-muted-foreground">You haven't followed any podcasts yet.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-6">
                Your Followed Podcasts
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {podcasts.map((podcast) => (
                    <PodcastCard key={podcast.podcast_id} podcast={podcast} />
                ))}
            </div>
        </div>
    );
}