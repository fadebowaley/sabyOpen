import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findCmsEntryBySlug, getCmsBasePath } from '@/app/shared/public-site/cms-entry-utils';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { cmsText } from '@/app/shared/public-site/cms-page-types';
import SabyCmsEntryDetailPage from '@/app/shared/public-site/saby-cms-entry-detail-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

type PageProps = { params: Promise<{ slug: string }> };
const key = 'product-updates';
const title = 'Product Updates';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cmsPage = await getPublishedCmsPage(key);
  const entry = findCmsEntryBySlug(cmsPage, key, slug);
  const metaTitle = cmsText(entry?.seoTitle || entry?.title, title);
  const metaDescription = cmsText(entry?.seoDescription || entry?.summary || entry?.contentText, 'Saby product update.');
  return metaObject(metaTitle, entry?.image?.url ? { images: { url: entry.image.url, width: 1200, height: 630 } } : undefined, metaDescription);
}

export default async function ProductUpdateDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [initialTheme, cmsPage] = await Promise.all([getInitialPublicTheme('dark'), getPublishedCmsPage(key)]);
  const entry = findCmsEntryBySlug(cmsPage, key, slug);
  if (!entry) notFound();
  return <SabyCmsEntryDetailPage entry={entry} collectionTitle={title} basePath={getCmsBasePath(key)} initialTheme={initialTheme} />;
}
