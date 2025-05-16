// app/search/page.tsx

import { createClient } from "@/utils/supabase/server";
import { PodcastCard, PodcastCardData } from "@/components/PodcastCard";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const runtime = 'edge';

interface SearchPageProps {
    searchParams: {
        query?: string;
    };
}

async function SearchResults({ query }: { query: string }) {
    const supabase = await createClient();

    // Call the custom RPC function in Supabase
    const { data: podcasts, error } = await supabase.rpc('search_podcasts', {
        query_text: query,
    });

    if (error) {
        console.error("Error searching podcasts:", error);
        return (
            <p className="text-destructive-foreground bg-destructive p-4 rounded-md mt-8">
                Error searching for podcasts. Please try again.
            </p>
        );
    }

    const podcastResults = podcasts as PodcastCardData[] | null;

    if (!podcastResults || podcastResults.length === 0) {
        return (
            <p className="text-muted-foreground mt-8">No podcasts found matching your query.</p>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-8">
            {podcastResults.map((podcast) => (
                <PodcastCard key={podcast.podcast_id} podcast={podcast} />
            ))}
        </div>
    );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const query = searchParams.query || "";

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Search Results</h1>
            {query ? (
                <>
                    <p className="text-lg text-muted-foreground">
                        Showing results for: <span className="font-semibold text-foreground">"{query}"</span>
                    </p>
                    <Suspense fallback={
                        <div className="flex justify-center items-center mt-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-2 text-muted-foreground">Searching...</p>
                        </div>
                    }>
                        <SearchResults query={query} />
                    </Suspense>
                </>
            ) : (
                <p className="text-muted-foreground mt-8">Please enter a search term.</p>
            )}
        </div>
    );
}
