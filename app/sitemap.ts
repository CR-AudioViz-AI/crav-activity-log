// app/sitemap.ts
// Added 2026-09-04 after Javari Verify found no sitemap.xml on this origin.
//
// Lists only routes that exist. A sitemap entry for a deleted or unbuilt page is
// an active instruction to search engines to index a 404 - worse than no sitemap,
// and exactly the defect found on javarikeys.com where two removed demo pages
// were still being crawled weeks after deletion.
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: 'https://javariactivity.com', lastModified: now, changeFrequency: 'weekly', priority: 1 },
  ];
}
