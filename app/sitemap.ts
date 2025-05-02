import { appConfig } from '@/lib/config';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: appConfig.url,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${appConfig.url}/auth`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ];
}
