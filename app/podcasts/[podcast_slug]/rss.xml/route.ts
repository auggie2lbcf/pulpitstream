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
    .replace(/'/g, "&apos;")
    .replace(/%/g, '%25')
    .replace(/\s/g, '%20');
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

  const podcastBaseUrl = `https://${siteUrl}/podcasts/${podcastData.feed_slug}`;
  const podcastFeedUrl = `${podcastBaseUrl}/feed.xml`;

  const feed = new Feed({
    title: podcastData.title,
    description: podcastData.description || "",
    id: podcastBaseUrl,
    link: podcastBaseUrl,
    language: podcastData.language || "en",
    favicon: `${siteUrl}/favicon.ico`,
    image: podcastData.image_url || `${siteUrl}/image.png`,
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

  feed.addExtension({
    name: 'itunes',
    objects: {
      owner: {
        name: `${profileData.first_name} ${profileData.last_name}`,
        email: profileData.email
      },
      author: `${profileData.first_name} ${profileData.last_name}`,
      category: ['Religion & Spirituality'],
      explicit: false,
      image: podcastData.image_url || `${siteUrl}/image.png`,
      summary: podcastData.description || "",
      type: 'episodic'
    }
  })

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
        id: episode.episode_slug,
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
          url: escapeXmlUrl(episode.audio_url),
          type: "audio/mpeg",
          length: episode.audio_url.length,
        },
      });
    });
  }

  feed.addCategory("Technologie"); //TODO: Add dynamic categories

  feed.addContributor({ //TODO: Add dynamic categories
    name: "Johan Cruyff",
    email: "johancruyff@example.com",
    link: "https://example.com/johancruyff"
  });

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=300",
      "Content-Length": Buffer.byteLength(feed.rss2()).toString(),
      "ETag": `"${podcast_slug}"`,
      "Last-Modified": new Date().toUTCString(),
      "Access-Control-Allow-Origin": "*", // CORS header
      "Access-Control-Allow-Methods": "GET, OPTIONS", // CORS header
      "Access-Control-Allow-Headers": "Content-Type, Authorization", // CORS header
      "Access-Control-Max-Age": "86400", // CORS header
      "Access-Control-Expose-Headers": "ETag, Last-Modified", // CORS header
      "Access-Control-Allow-Credentials": "true", // CORS header
      "Access-Control-Allow-Private-Network": "true", // CORS header
      "Access-Control-Allow-Client-Certificate": "true", // CORS header
      "Access-Control-Allow-Preflight": "true", // CORS header
      "Access-Control-Allow-Request-Headers": "Content-Type, Authorization", //
      "Access-Control-Allow-Request-Method": "GET, OPTIONS", // CORS header
    },
  });
}
