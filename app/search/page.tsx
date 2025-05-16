// app/search/page.tsx

import {createClient} from "@/utils/supabase/server";
import {PodcastCard, PodcastCardData} from "@/components/PodcastCard";
import {Suspense} from "react";
import {Loader2} from "lucide-react";
import Link from "next/link"; // Import Link

export const runtime = 'edge';

interface SearchPageProps {
    searchParams: {
        query?: string;
    };
}

interface SearchResultsData {
    podcasts: PodcastCardData[] | null;
    suggestion: string | null; // Add suggestion field
}

async function performSearch(query: string): Promise<SearchResultsData> {
    const supabase = await createClient();

    // 1. Perform the primary search
    const { data: podcasts, error: searchError } = await supabase.rpc('search_podcasts', {
        query_text: query,
    });

    if (searchError) {
        console.error("Error searching podcasts:", searchError);
        // Handle the error, maybe return empty results and no suggestion
        return { podcasts: null, suggestion: null };
    }

    const podcastResults = podcasts as PodcastCardData[] | null;

    let suggestion: string | null = null;

    // 2. If no podcasts found, try to get a suggestion
    if (!podcastResults || podcastResults.length === 0) {
        const { data: suggestedQuery, error: suggestionError } = await supabase.rpc('get_search_suggestion', {
            query_text: query,
        });

        if (suggestionError) {
            console.error("Error getting search suggestion:", suggestionError);
            // Continue without a suggestion if there's an error
        } else {
            suggestion = suggestedQuery as string | null;
        }
    }

    return { podcasts: podcastResults, suggestion };
}


async function SearchResults({ query }: { query: string }) {
    // Await the combined search and suggestion logic
    const { podcasts, suggestion } = await performSearch(query);

    if (!podcasts || podcasts.length === 0) {
        return (
            <div className="mt-8">
                <p className="text-muted-foreground">No podcasts found matching your query.</p>
                {suggestion && suggestion !== query && ( // Check if suggestion is different from original query
                    <p className="text-muted-foreground mt-4">
                        Did you mean:{" "}
                        <Link
                            href={`/search?query=${encodeURIComponent(suggestion)}`}
                            className="text-primary hover:underline font-semibold"
                        >
                            {suggestion}
                        </Link>
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mt-8">
            {podcasts.map((podcast) => (
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
                        {/* Pass the awaited query to SearchResults */}
                        <SearchResults query={query} />
                    </Suspense>
                </>
            ) : (
                <p className="text-muted-foreground mt-8">Please enter a search term.</p>
            )}
        </div>
    );
}