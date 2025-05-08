import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import xml from "xml";

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

  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select(
      "*"
    )
    .eq("podcast_slug", podcast_slug)
    .order("publication_date", { ascending: false });

  if (episodesError) {
    console.error("Error fetching episodes:", episodesError);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;
  const podcastBaseUrl = `https://${siteUrl}/podcasts/${podcastData.podcast_slug}`;
  const podcastFeedUrl = `${podcastBaseUrl}/rss`;


  var rssFeed = `<?xml version="1.0" encoding="UTF-8"?>`;
  rssFeed = rssFeed + (`<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0" xmlns:podcast="https://podcastindex.org/namespace/1.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">`
  );
  rssFeed = rssFeed +(`\t<channel>`);
  rssFeed = rssFeed +(`\t\t<title>${podcastData.title}</title>`);
  rssFeed = rssFeed +(`\t\t<link>${podcastBaseUrl}</link>`);
  rssFeed = rssFeed +(`\t\t<description>${podcastData.description}</description>`);
  rssFeed = rssFeed +(`\t\t<language>${podcastData.language || "en"}</language>`);
  // rssFeed = rssFeed +(`\t\t<copyright>Copyright ${new Date().getFullYear()} ${podcastData.podcast_author}. All rights reserved.</copyright>`);
  rssFeed = rssFeed +(`\t\t<lastBuildDate>${new Date(
    podcastData.updated_at || podcastData.created_at
  ).toUTCString()}</lastBuildDate>`);
  rssFeed = rssFeed +(`\t\t<pubDate>${new Date(
    podcastData.updated_at || podcastData.created_at
  ).toUTCString()}</pubDate>`);
  rssFeed = rssFeed +('\t\t<image>');
  rssFeed = rssFeed +(`\t\t\t<url>${podcastData.image_url}</url>`);
  rssFeed = rssFeed +(`\t\t\t<title>${podcastData.title}</title>`);
  rssFeed = rssFeed +(`\t\t\t<link>${podcastBaseUrl}</link>`);
  rssFeed = rssFeed +(`\t\t</image>`);
  rssFeed = rssFeed +(`\t\t<itunes:summary>${podcastData.description}</itunes:summary>`);
  rssFeed = rssFeed +(`\t\t<itunes:author>${podcastData.owner}</itunes:author>`);
  rssFeed = rssFeed +(`\t\t<itunes:explicit>${podcastData.explicit ? "yes" : "no"}</itunes:explicit>`);
  rssFeed = rssFeed +(`\t\t<itunes:category text="${podcastData.categories}">`);
  rssFeed = rssFeed +(`\t\t\t<itunes:category text="${podcastData.subcategory}"/>`);
  rssFeed = rssFeed +(`\t\t</itunes:category>`);
  rssFeed = rssFeed +(`\t\t<itunes:owner>`);
  rssFeed = rssFeed +(`\t\t\t<itunes:name>${podcastData.owner}</itunes:name>`);
  rssFeed = rssFeed +(`\t\t\t<itunes:email>${podcastData.email}</itunes:email>`);
  rssFeed = rssFeed +(`\t\t</itunes:owner>`);
  rssFeed = rssFeed +(`\t\t<itunes:link>${podcastBaseUrl}</itunes:link>`);
  rssFeed = rssFeed +(`\t\t<itunes:image href="${podcastData.image_url}"/>`);
  rssFeed = rssFeed +(`\t\t<atom:link href="${podcastFeedUrl}" rel="self" type="application/rss"/>`);
  rssFeed = rssFeed +(`\t\t<anchor:link href="${podcastFeedUrl}" rel="self" type="application/rss"/>`);
  rssFeed = rssFeed +(`\t\t<podcast:link href="${podcastFeedUrl}" rel="self" type="application/rss+"/>`);
  rssFeed = rssFeed +(`\t\t<generator>PulpitStream.com</generator>`);

  if (episodes) {
    for (const episode of episodes) {
      const episodeUrl = `${podcastBaseUrl}/episodes/${episode.episode_slug}`;
      const episodeAudioUrl = episode.audio_url || episode.audio_file_url;
      const episodeImageUrl = episode.image_url || podcastData.podcast_image_url;

      rssFeed = rssFeed +(`\t\t<item>`);
      rssFeed = rssFeed +(`\t\t\t<title>${episode.title}</title>`);
      rssFeed = rssFeed +(`\t\t\t<link>${episodeUrl}/${episode.guid}</link>`);
      rssFeed = rssFeed +(`\t\t\t<guid isPermaLink="false">${episode.guid}</guid>`);
      rssFeed = rssFeed +(`\t\t\t<description>${episode.description}</description>`);
      rssFeed = rssFeed +(`\t\t\t<pubDate>${new Date(episode.publication_date).toUTCString()}</pubDate>`);
      rssFeed = rssFeed +(`\t\t\t<itunes:summary>${episode.description}</itunes:summary>`);
      rssFeed = rssFeed +(`\t\t\t<itunes:author>${podcastData.speaker_id}</itunes:author>`);
      rssFeed = rssFeed +(`\t\t\t<itunes:explicit>${podcastData.explicit ? "yes" : "no"}</itunes:explicit>`);
      rssFeed = rssFeed +(`\t\t\t<itunes:image href="${episodeImageUrl}"/>`);
      rssFeed = rssFeed +(`\t\t\t<enclosure url="${escapeXmlUrl(episodeAudioUrl)}" length="${episode.audio_length}" type="audio/mp4"/>`);
      rssFeed = rssFeed +(`\t\t</item>`);
    }
  }
  rssFeed = rssFeed +(`\t</channel>`);
  rssFeed = rssFeed +(`</rss>`);

  console.log("Generated RSS feed for podcast:", podcast_slug);
  console.log("RSS feed length:", rssFeed.length);

  return new NextResponse(rssFeed, {  
    headers: {
      "Content-Type": "application/rss",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
  }},);
}
