import { Feed } from "feed";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Helper function to escape XML special characters in a URL
function escapeXmlUrl(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const runtime = 'edge';

type PodcastFeedParams = Promise<{
  podcast_slug: string;
}>;

export async function GET(
  request: Request,
  { params }: { params: PodcastFeedParams },
) {
  // Get the podcast_slug from the dynamic route parameters
  const podcastSlug = await params;

  const supabase = await createClient();

  // Fetch podcast details to use in the feed metadata
  const { data: podcastData, error: podcastError } = await supabase
    .from("podcasts")
    .select("title, description, image_url, language, feed_slug")
    .eq("feed_slug", podcastSlug)
    .single();

  if (podcastError || !podcastData) {
    console.error(
      "Error fetching podcast details for RSS feed:",
      podcastError,
    );
    return new NextResponse("Podcast not found or could not generate RSS feed", {
      status: 404,
    });
  }

  // Construct the base URL for your site dynamically or from environment variables
  // For local development, you might use localhost. For production, your actual domain.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`; // Replace with your actual site URL or env variable
  const podcastBaseUrl = `${siteUrl}/podcasts/${podcastData.feed_slug}`;

  const feed = new Feed({
    title: podcastData.title || "My Podcast",
    description: podcastData.description || "Episodes from my podcast",
    id: podcastBaseUrl + "/", // Unique ID for the feed
    link: podcastBaseUrl, // Link to the podcast page
    language: podcastData.language || "en",
    image: podcastData.image_url || `${siteUrl}/default-podcast-image.png`, // Fallback image
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Your Name or Company`,
    updated: new Date(), // Or use the date of the latest episode
    generator: "Next.js using Feed package",
    feedLinks: {
      // Correctly point to this feed's URL
      rss: `${podcastBaseUrl}/rss.xml`,
      // atom: `${podcastBaseUrl}/atom.xml`, // If you plan to create an Atom feed
    },
    author: {
      name: "Your Name or Podcast Host", // Replace
      // email: "you@example.com", // Optional
      // link: "https://example.com/about-host", // Optional
    },
  });

  // Fetch episodes for this specific podcast
  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select(
      "title, episode_slug, description, date, audio_url, image_url, passage, series, speaker_id",
    )
    .eq("podcast_slug", podcastSlug)
    .order("date", { ascending: false });

  if (episodesError) {
    console.error("Error fetching episodes for RSS feed:", episodesError);
    // Decide if you want to return an error or an empty feed
  }

  if (episodes) {
    episodes.forEach((episode) => {
      const episodeUrl = `${podcastBaseUrl}/${episode.episode_slug}`;
      let escapedAudioUrl = episode.audio_url;

      if (escapedAudioUrl) {
        escapedAudioUrl = escapeXmlUrl(escapedAudioUrl);
      }

      feed.addItem({
        title: episode.title,
        id: episodeUrl,
        link: episodeUrl, // Consider escaping this URL as well if it might contain special characters
        description: episode.description || "",
        content: episode.description || "", // Or full content/shownotes
        author: [
          {
            name: "Your Name or Episode Speaker", // Potentially fetch speaker name using speaker_id
            // email: "speaker@example.com",
            // link: "link-to-speaker-bio.com"
          },
        ],
        date: new Date(episode.date),
        image: episode.image_url || podcastData.image_url || "/image.png", // Episode image, fallback to podcast image
        enclosure: escapedAudioUrl
          ? {
              url: escapedAudioUrl,
              type: episode.audio_url.endsWith(".m4a")
                ? "audio/x-m4a"
                : "audio/mpeg", // Basic type detection, adjust as needed
              // length: you might need to get the file size if required by some podcatchers
            }
          : undefined,
        // You can add other iTunes specific tags here if needed, e.g.,
        // itunesAuthor: "...",
        // itunesSubtitle: "...",
        // itunesSummary: episode.description || "",
        // itunesDuration: "HH:MM:SS", // if you have duration data
        // itunesExplicit: false,
        // itunesImage: episode.image_url || podcastData.image_url || undefined,
        // itunesEpisode: episode.episode_num, // If you have episode numbers
        // itunesSeason: ..., // If you have season numbers
      });
    });
  }

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8", // Correct MIME type for RSS
    },
  });
}