import {
  cmsItemSlug,
  cmsText,
  findCmsSection,
  sanitizeCmsHtml,
  type PublicCmsItem,
  type PublicCmsPage,
  type PublicCmsSection,
} from '@/app/shared/public-site/cms-page-types';

export type PublicCmsEntry = PublicCmsItem & {
  slug: string;
  href: string;
  title: string;
  summary: string;
  contentHtml: string;
};

const pageBasePaths: Record<string, string> = {
  'product-updates': '/product-updates',
  documentation: '/documentation',
  partners: '/partners',
  'privacy-policy': '/privacy-policy',
  'terms-of-service': '/terms-of-service',
  blog: '/blog',
};

const legacyEntrySectionIds: Record<string, string[]> = {
  'product-updates': ['entries', 'updates'],
  documentation: ['entries', 'featured', 'links'],
  partners: ['entries', 'cards'],
  'privacy-policy': ['entries', 'legal-sections'],
  'terms-of-service': ['entries', 'legal-sections'],
  blog: ['entries', 'articles'],
};

export const getCmsBasePath = (key: string) => pageBasePaths[key] || `/${key}`;

export const findCmsEntrySection = (
  cmsPage: PublicCmsPage | null | undefined,
  key: string
): PublicCmsSection | undefined => {
  const sectionIds = legacyEntrySectionIds[key] || ['entries'];
  for (const sectionId of sectionIds) {
    const section = findCmsSection(cmsPage, sectionId);
    if (section?.items?.length) return section;
  }
  return undefined;
};

export const mapCmsEntry = (
  item: PublicCmsItem,
  key: string,
  index = 0
): PublicCmsEntry => {
  const slug = cmsItemSlug(item) || `entry-${index + 1}`;
  const basePath = getCmsBasePath(key);
  const href = cmsText(item.href, `${basePath}/${slug}`);

  return {
    ...item,
    slug,
    href,
    title: cmsText(item.title, 'Untitled'),
    summary: cmsText(item.summary || item.description || item.body || item.contentText, ''),
    contentHtml: sanitizeCmsHtml(item.contentHtml),
  };
};

export const getCmsEntries = (
  cmsPage: PublicCmsPage | null | undefined,
  key: string
): PublicCmsEntry[] => {
  const section = findCmsEntrySection(cmsPage, key);
  const rawItems = section?.items || [];
  const hasManagedPublishStatus = rawItems.some((item) =>
    ['draft', 'published'].includes(String(item?.status || '').toLowerCase())
  );

  return rawItems
    .filter((item) => item?.title)
    .filter((item) => {
      if (!hasManagedPublishStatus) return true;
      return String(item.status || '').toLowerCase() === 'published';
    })
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((item, index) => mapCmsEntry(item, key, index));
};

export const findCmsEntryBySlug = (
  cmsPage: PublicCmsPage | null | undefined,
  key: string,
  slug: string
): PublicCmsEntry | null => {
  const entries = getCmsEntries(cmsPage, key);
  return entries.find((entry) => entry.slug === slug) || null;
};
