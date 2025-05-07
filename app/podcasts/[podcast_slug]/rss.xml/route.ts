import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { Tables } from "@/types/supabase";
import { Podcast } from "podcast";
import { Feed } from "feed";

export const runtime = "edge";

function escapeXmlUrl(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/%/g, "%25")
    .replace(/\s/g, "%20");
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
    .select("*")
    .eq("podcast_slug", podcast_slug)
    .single();

  if (podcastError || !podcastData) {
    console.error("Error fetching podcast:", podcastError);
    console.error("Podcast not found for slug:", podcast_slug);
    return new NextResponse("Podcast not found", { status: 404 });
  }

  const podcastBaseUrl = `https://${siteUrl}/podcasts/${podcastData.podcast_slug}`;
  const podcastFeedUrl = `${podcastBaseUrl}/rss.xml`;


  const feed = new Feed({
    title: podcastData.title,
    generator: "Feed for Next.js",
    id: podcastBaseUrl,
    link: podcastBaseUrl,
    description: podcastData.description || "",
    language: podcastData.language || "en",
    copyright: `Copyright © ${new Date().getFullYear()} ${podcastData.title}`,
    image: podcastData.image_url,
    
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
        link: episodeUrl,
        description: episode.description
          ?.replace(/<[^>]*>?/gm, "")
          .substring(0, 255),
        content: episode.description,
        date: new Date(episode.date),
        enclosure: {
          url: escapeXmlUrl(episode.audio_url),
          type: "audio/mpeg",
        },
      });
    });
  }

  const xml = feed.rss2();

  return new NextResponse(xml, {  
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Length": Buffer.byteLength(xml).toString(),
      "Content-Disposition": `inline; filename="${podcastData.title}.xml"`,
      "Content-Transfer-Encoding": "binary",
      "Content-Encoding": "gzip",
      "Content-Language": podcastData.language || "en",
      "X-Content-Encoding": "gzip",
      "X-Download-Options": "noopen",
      "X-Permitted-Cross-Domain-Policies": "none",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "no-referrer",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range",
      "Access-Control-Request-Headers": "Content-Type",
      "Access-Control-Request-Method": "GET",
  }},);
}
