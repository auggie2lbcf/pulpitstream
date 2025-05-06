// /app/podcasts/[podcast_slug]/rss.xml/route.ts
// This file generates an RSS feed for a specific podcast based on its slug.
// It uses the Feed package to create the RSS XML structure and fetches data from Supabase.
//
// The feed includes metadata about the podcast and its episodes, and is served with the correct MIME type.
//
// The feed is generated dynamically based on the podcast slug provided in the URL.
// It also handles errors gracefully, returning a 404 response if the podcast is not found or if there are issues fetching data.


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

type PodcastFeedProps = Promise<{
  podcast_slug: string;
}>;

export async function GET( request: Request,{ params } : { params : PodcastFeedProps }) {
  // Get the podcast_slug from the dynamic route parameters
  const { podcast_slug } = await params;

  const supabase = await createClient();

  // Fetch podcast details to use in the feed metadata
  const { data: podcastData, error: podcastError } = await supabase
    .from("podcasts")
    .select("title, description, image_url, language, feed_slug, user_id")
    .eq("feed_slug", podcast_slug)
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

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", podcastData.user_id)
    .single();

  if (profileError || !profileData) {
    console.error(
      "Error fetching profile details for RSS feed:",
      profileError,
    );
    return new NextResponse("Podcast not found or could not generate RSS feed", {
      status: 404,
    });
  }

  // Construct the base URL for your site dynamically or from environment variables
  // For local development, you might use localhost. For production, your actual domain.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`; // Replace with your actual site URL or env variable
  const podcastBaseUrl = `https://${siteUrl}/podcasts/${podcastData.feed_slug}`;

  const podcastFeed = new Feed({
    title: podcastData.title || "My Podcast",
    description: podcastData.description || "Episodes from my podcast",
    id: podcastBaseUrl + "/", // Unique ID for the feed
    link: podcastBaseUrl + "/rss.xml", // Link to the podcast page
    language: podcastData.language || "en",
    image: podcastData.image_url || `${siteUrl}/image.png`, // Fallback image
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Your Name or Company`,
    updated: new Date(), // Or use the date of the latest episode
    generator: "Next.js using Feed package",
    feedLinks: {
      self: `${podcastBaseUrl}/rss.xml`,
      rss: `${podcastBaseUrl}/rss.xml`,
    },
    author: {
      name: podcastData.title,
      email: profileData.email,
      link: "https://example.com/about-host",
    },

  });

  // Fetch episodes for this specific podcast
  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select(
      "title, episode_slug, description, date, audio_url, image_url, passage, series, speaker_id",
    )
    .eq("podcast_slug", podcast_slug)
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

      podcastFeed.addItem({
        title: episode.title,
        id: episodeUrl, // Unique ID for the episode
        link: escapedAudioUrl, // TODO - Check if this should be the episode URL or audio URL
        description: episode.description || "",
        content: episode.description || "", // Or full content/shownotes
        author: [{
          name: podcastData.title,
          email: profileData.email,
          link: "https://example.com/about-host",
        },],
        category: episode.series,
        date: new Date(episode.date),
        image: episode.image_url || podcastData.image_url || `${siteUrl}/image.png`, // Episode image, fallback to podcast image
        enclosure: escapedAudioUrl
          ? {
              url: escapedAudioUrl,
              type: episode.audio_url.endsWith(".m4a")
                ? "audio/x-m4a"
                : "audio/mpeg", // Basic type detection, adjust as needed
              length: episode.audio_url.length, // Length in bytes, if known
            }
          : undefined,
        
      });
    });
  }

  return new NextResponse(podcastFeed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8", // Correct MIME type for RSS
    },
  });
}

