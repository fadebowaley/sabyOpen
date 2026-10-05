import { buildInternalApiUrl } from '@/app/api/_lib/backend-url';
import type { PublicCmsPage } from './cms-page-types';
import { findCmsEntryBySlug } from './cms-entry-utils';

export async function getPublishedCmsPage(key: string): Promise<PublicCmsPage | null> {
  try {
    const response = await fetch(buildInternalApiUrl(`/cms/public/pages/${encodeURIComponent(key)}`), {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = (await response.json().catch(() => ({}))) as { page?: PublicCmsPage };
    return data.page || null;
  } catch {
    return null;
  }
}

export async function getPublishedCmsEntry(key: string, slug: string) {
  const cmsPage = await getPublishedCmsPage(key);
  return {
    cmsPage,
    entry: findCmsEntryBySlug(cmsPage, key, slug),
  };
}
