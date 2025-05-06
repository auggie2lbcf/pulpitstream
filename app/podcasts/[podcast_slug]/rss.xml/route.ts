// app/podcast/[podcast_slug]/rss.xml/route.ts
import RSS from 'rss';
import { createClient } from '@/utils/supabase/server'; // Or your preferred Supabase client
import { NextRequest, NextResponse } from 'next/server';

type PodcastEpisodePageProps = Promise<{
    podcast_slug: string;
}>;

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  {  params } : { params : PodcastEpisodePageProps }) {
  const supabase = await createClient();
  const { podcast_slug } = await params;

  // 1. Fetch podcast details from Supabase
  const { data: podcastData, error: podcastError } = await supabase
    .from('podcasts')
    .select('*')
    .eq('feed_slug', podcast_slug)
    .single();

  if (podcastError || !podcastData) {
    return new NextResponse('Podcast not found', { status: 404 });
  }

  // 2. Fetch episodes for this podcast
  const { data: episodesData, error: episodesError } = await supabase
    .from('episodes')
    .select('*')
    .eq('podcast_slug', podcast_slug)
    .order('date', { ascending: false }); // Or your preferred ordering

  if (episodesError) {
    return new NextResponse('Error fetching episodes', { status: 500 });
  }

  // 3. Create a new RSS feed instance
  // Ensure you have a base URL for your site, perhaps from environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const feedUrl = `${siteUrl}/podcast/${podcast_slug}/rss.xml`;

  const feed = new RSS({
    title: podcastData.title || 'My Podcast',
    description: podcastData.description || 'Podcast description',
    feed_url: feedUrl,
    site_url: siteUrl, // Link to the main site or podcast page
    image_url: podcastData.image_url || `${siteUrl}/image.jpg`,
    language: podcastData.language || 'en',
    categories: podcastData.category ? [podcastData.category] : [],
    pubDate: new Date(), // Or the date of the latest episode
    copyright: `All rights reserved ${new Date().getFullYear()}, Your Name/Company`,
    // ttl: 60, // Time to live in minutes
    custom_namespaces: {
      itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
    },
    custom_elements: [
      { 'itunes:author': podcastData.author || 'Podcast Author' },
      { 'itunes:summary': podcastData.description || '' },
      { 'itunes:explicit': podcastData.explicit ? 'yes' : 'no' },
      { 'itunes:image': { _attr: { href: podcastData.image_url || `${siteUrl}/image.jpg` } } },
      { 'itunes:category': podcastData.category ? [{ _attr: { text: podcastData.category } }] : [] },
      { 'itunes:owner': [
        { 'itunes:name': podcastData.owner_name || 'Owner Name' },
        { 'itunes:email': podcastData.owner_email || 'Owner Email' },
        ] 
      },
      { 'itunes:link': feedUrl },
    //   { 'itunes:subtitle': podcastData.subtitle || '' },
        { 'itunes:summary': podcastData.description || '' },
        // { 'itunes:keywords': podcastData.keywords ? podcastData.keywords.split(',') : [] },
    ]
  });

  // 4. Add episodes as items to the feed
  episodesData?.forEach(episode => {
    feed.item({
      title: episode.title,
      description: episode.description || '',
      url: `${siteUrl}/podcast/${podcast_slug}/episode/${episode.episode_slug}`, // URL to the episode page
      guid: episode.id.toString(), // A unique ID for the episode
      date: episode.date,
      enclosure: {
        url: episode.audio_url,
        type: 'audio/mpeg', // Adjust based on your audio file type
        // size: episode.audio_size, // Optional: file size in bytes
      },
      author: episode.speaker_id || 'Podcast Author', // You might want to fetch speaker details
      // You can add more fields like 'itunes:duration', 'itunes:image', etc.
    });
  });

  // 5. Generate the XML
  const xml = feed.xml({ indent: true });

  // 6. Return the XML response
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Optional: Cache control headers
      // 'Cache-Control': 's-maxage=3600, stale-while-revalidate', // Cache for 1 hour
    },
  });
}