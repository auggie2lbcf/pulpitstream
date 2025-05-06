import { Feed } from "feed";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import RSS from "rss";

function escapeXmlUrl(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const runtime = 'nodejs';

type PodcastFeedProps = Promise<{
  podcast_slug: string;
}>;


export async function GET( request: Request,{ params } : { params : PodcastFeedProps }) {
  const { podcast_slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`; // Replace with your actual site URL or env variable
  
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
    .select("id, email, first_name, last_name")
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

  const podcastBaseUrl = `https://${siteUrl}/podcasts/${podcastData.feed_slug}`;
  const podcastFeedUrl = `${podcastBaseUrl}/feed.xml`;
  const podcastFeedUrlEscaped = escapeXmlUrl(podcastFeedUrl); 

  const feed = new RSS({
    title: podcastData.title,
    description: podcastData.description || '',
    feed_url: podcastFeedUrl,
    site_url: "test.com",//podcastData.websiteUrl,
    image_url: '${siteUrl}/image.png',//podcastData.artworkUrl,
    managingEditor: `${profileData.email} (${profileData.first_name})`,
    webMaster: `${profileData.email} (${profileData.first_name})`,
    copyright: "Copyright © " + new Date().getFullYear() + " " + podcastData.title,
    language: podcastData.language,
    categories: podcastData.language || [],
    pubDate: new Date(),
    ttl: 60, // Time to live in minutes
    custom_namespaces: {
      'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
      'podcast': 'https://podcastindex.org/namespace/1.0',
      'content': 'http://purl.org/rss/1.0/modules/content/',
      'atom': 'http://www.w3.org/2005/Atom',
    },
    custom_elements: [
      { 'atom:link': { _attr: { href: podcastFeedUrl, rel: 'self', type: 'application/rss+xml' } } },
      { 'itunes:author': podcastData.title },
      { 'itunes:summary': podcastData.description},
      { 'itunes:owner': [
          { 'itunes:name': podcastData.title },
          { 'itunes:email': profileData.email }
        ]
      },
      { 'itunes:image': { _attr: { href: '${siteUrl}/image.png'} } }, //{ _attr: { href: podcastData.artworkUrl } } },
      { 'itunes:explicit': 'no'},  //podcastData.isExplicit ? 'yes' : 'no' },
      { 'itunes:type': 'episodic'}, //podcastData.type || 'episodic' },
      { 'itunes:category': [
          { _attr: { text: podcastData.language } },
          // Example for subcategory:
          // ...(showInfo.subCategory ? [{ 'itunes:category': { _attr: { text: showInfo.subCategory } } }] : [])
        ]
      },
      // Podcast Index elements
      { 'podcast:locked': { _attr: { owner: profileData.email }, value: 'no' } }, // 'yes' to lock, 'no' to unlock
      // { 'podcast:guid': podcastData.podcastGuid },
    ]
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

      const itemCustomElements = [
        { 'itunes:author': episode.speaker_id || podcastData.title },
        { 'itunes:subtitle': '' },
        { 'itunes:summary': episode.description || episode.description.replace(/<[^>]*>?/gm, '').substring(0, 3800) }, // Plain text, max ~4000 chars
        // { 'itunes:duration': episode.duration },
        // { 'itunes:explicit': episode.isExplicit === undefined ? (showInfo.isExplicit ? 'yes' : 'no') : (episode.isExplicit ? 'yes' : 'no') },
        { 'content:encoded': `<![CDATA[${episode.description}]]>` },
      ];

      feed.item({
        title: episode.title,
        description: episode.description.replace(/<[^>]*>?/gm, '').substring(0, 255), // Plain text for RSS description
        url: episodeUrl,
        categories: [episode.series],
        author: episode.speaker_id || podcastData.title,
        date: episode.date,
        enclosure: {
          url: escapedAudioUrl,
          // size: episode.audioFileSizeInBytes,
          // type: episode.audioFileType
        },
        custom_elements: itemCustomElements,
      });
    });
  }

  const xml = feed.xml({ indent: true });

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300', // Cache for 10 mins, revalidate after 5 mins
    },
  });
}