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
    name: "podcast:author",
    objects: podcastData.author,
  });

  feed.addExtension({
    name: "podcast:summary",
    objects: podcastData.description,
  });
  feed.addExtension({
    name: "podcast:explicit",
    objects: podcastData.explicit ? "yes" : "no",
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
          name: "itunes:summary",
          objects: episode.description,
        }, {
          name: "itunes:duration",
          objects: episode.audio_length,
        }, {
          name: "itunes:explicit",
          objects: episode.explicit ? "yes" : "no",
        }, {
          name: "itunes:image",
          objects: episode.image_url,
        }, {
          name: "itunes:author",
          objects: episode.author,
        },],
        enclosure: {
          url: escapeXmlUrl(episode.audio_url),
          type: "audio/mp4",
          length: episode.audio_length,
        },},
      );
    });
  }

  let originalString = feed.rss2();
  // let originalString = '<?xml version="1.0" encoding="UTF-8"?>  <rss version="2.0"><channel>data</channel></rss>'; // with spaces

  const xmlDeclaration = '<?xml version="1.0" encoding="utf-8"?>';
  const stringToAdd = '\n\t<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:anchor="https://anchor.fm/xmlns" xmlns:podcast="https://podcastindex.org/namespace/1.0">';
  const stringToRemove = '<rss version=\"2.0\">\n';

  // This variable will hold the final modified string
  let finalModifiedString = "";

  // --- Step 1: Insert "ts" ---
  let stringAfterTsInsertion = originalString.replace(xmlDeclaration, xmlDeclaration + stringToAdd);

  // Check if the XML declaration was found and "ts" was actually inserted
  // Note: JS replace only replaces the first occurrence by default if using a string searchValue
  if (stringAfterTsInsertion === originalString && !originalString.startsWith(xmlDeclaration)) {
      console.log("XML declaration not found. Cannot insert 'ts'.");
      finalModifiedString = originalString; // Or handle as an error
  } else {
      // --- Step 2: Remove "<rss" that comes after the inserted "ts" ---
      const markerForRemovalSearch = xmlDeclaration + stringToAdd;
      
      const indexOfMarkerEnd = stringAfterTsInsertion.indexOf(markerForRemovalSearch);
      
      if (indexOfMarkerEnd !== -1) {
          const searchStartIndexForRss = indexOfMarkerEnd + markerForRemovalSearch.length;
          
          // Find the first occurrence of "<rss" *after* our marker
          const indexOfRssToRemove = stringAfterTsInsertion.indexOf(stringToRemove, searchStartIndexForRss);
          
          if (indexOfRssToRemove !== -1) {
              // If "<rss" is found after "ts", construct the final string
              const partBeforeRss = stringAfterTsInsertion.substring(0, indexOfRssToRemove);
              const partAfterRss = stringAfterTsInsertion.substring(indexOfRssToRemove + stringToRemove.length);
              finalModifiedString = partBeforeRss + partAfterRss;
          } else {
              console.log(`'${stringToRemove}' not found after '${markerForRemovalSearch}'.`);
              finalModifiedString = stringAfterTsInsertion;
          }
      } else {
          console.error("Error: Marker for 'ts' insertion point not found. String might be unexpected.");
          finalModifiedString = stringAfterTsInsertion;
      }
  }

  return new NextResponse(finalModifiedString, {  
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "Content-Length": Buffer.byteLength(finalModifiedString).toString(),
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
