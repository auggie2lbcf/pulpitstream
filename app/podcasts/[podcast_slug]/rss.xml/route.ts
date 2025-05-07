import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
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
    feedLinks: {
      self: podcastFeedUrl,
      rss2: podcastFeedUrl
    }
  });

  feed.addExtension({
    name: "podcast",
    objects: {
      "podcast:author": podcastData.author,
      "podcast:summary": podcastData.description,
      "podcast:explicit": podcastData.explicit ? "yes" : "no",
      "podcast:category": podcastData.category,
      "podcast:link": podcastFeedUrl,
      "podcast:owner": {
        "podcast:name": podcastData.owner_name,
        "podcast:email": podcastData.owner_email,
      },
      "itunes:summary": podcastData.description,
      "itunes:author": podcastData.author,
      "itunes:explicit": podcastData.explicit ? "yes" : "no",
      "itunes:category": podcastData.category,
      "itunes:owner": {
        "itunes:name": podcastData.owner_name,
        "itunes:email": podcastData.owner_email,
      },
      "itunes:image": podcastData.image_url,
    },
  });

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

  if (episodes) {
    episodes.forEach((episode) => {
      const episodeUrl = `${podcastBaseUrl}/${episode.guid}`;
      feed.addItem({
        title: episode.title,
        id: episodeUrl,
        link: episodeUrl,
        description: episode.description
          ?.replace(/<[^>]*>?/gm, "")
          .substring(0, 255),
        date: new Date(episode.publication_date),
        extensions: [{
          name: "itunes",
          objects: {
            "itunes:summary": episode.description,
            "itunes:author": podcastData.author,
            "itunes:duration": episode.duration,
            "itunes:explicit": podcastData.explicit ? "yes" : "no",
            "itunes:image": episode.image_url,
          },
        },],
        enclosure: {
          url: escapeXmlUrl(episode.audio_url),
          type: "audio/mp4",
          length: episode.audio_length,
        },},
      );
    });
  }

  return new NextResponse(feed.rss2(), {  
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Length": Buffer.byteLength(feed.rss2()).toString(),
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
