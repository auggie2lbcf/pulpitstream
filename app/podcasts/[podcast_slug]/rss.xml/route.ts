import { Feed } from "feed";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

function escapeXmlUrl(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type PodcastFeedProps = Promise<{
  podcast_slug: string;
}>;

export async function GET(
  request: Request,
  { params }: { params: PodcastFeedProps }
) {
  const { podcast_slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;

  const supabase = await createClient();

  const { data: podcastData, error: podcastError } = await supabase
    .from("podcasts")
    .select("title, description, image_url, language, feed_slug, user_id")
    .eq("feed_slug", podcast_slug)
    .single();

  if (podcastError || !podcastData) {
    return new NextResponse("Podcast not found", { status: 404 });
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("id", podcastData.user_id)
    .single();

  if (profileError || !profileData) {
    return new NextResponse("Author not found", { status: 404 });
  }

  const podcastBaseUrl = `${siteUrl}/podcasts/${podcastData.feed_slug}`;
  const podcastFeedUrl = `${podcastBaseUrl}/feed.xml`;

  const feed = new Feed({
    title: podcastData.title,
    description: podcastData.description || "",
    id: podcastBaseUrl,
    link: podcastBaseUrl,
    language: podcastData.language || "en",
    favicon: `${siteUrl}/favicon.ico`,
    image: podcastData.image_url || `${siteUrl}/default-image.png`,
    updated: new Date(),
    generator: "Feed for Next.js",
    copyright: `Copyright © ${new Date().getFullYear()} ${profileData.first_name} ${profileData.last_name}`,
    feedLinks: {
      rss2: podcastFeedUrl,
    },
    author: {
      name: `${profileData.first_name} ${profileData.last_name}`,
      email: profileData.email,
    },
  });

  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select(
      "title, episode_slug, description, date, audio_url, image_url, passage, series, speaker_id"
    )
    .eq("podcast_slug", podcast_slug)
    .order("date", { ascending: false });

  if (episodesError) {
    console.error("Error fetching episodes:", episodesError);
  }

  if (episodes) {
    episodes.forEach((episode) => {
      const episodeUrl = `${podcastBaseUrl}/${episode.episode_slug}`;
      feed.addItem({
        title: episode.title,
        id: episodeUrl,
        link: escapeXmlUrl(episode.audio_url),
        description: episode.description?.replace(/<[^>]*>?/gm, "").substring(0, 255),
        content: episode.description,
        author: [
          {
            name: episode.speaker_id || podcastData.title,
          },
        ],
        date: new Date(episode.date),
        enclosure: {
          url: episode.audio_url,
          type: "audio/mpeg",
        },
      });
    });
  }

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
