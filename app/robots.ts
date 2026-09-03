// app/robots.ts
// Added 2026-09-04 after Javari Verify found no robots.txt on this origin.
//
// Crawlers work without one, but there is nowhere to point them at the sitemap
// and nowhere to exclude paths that should not be indexed. Both matter more as
// an app grows than they do on the day it launches.
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] }],
    sitemap: 'https://javariactivity.com/sitemap.xml',
  };
}
