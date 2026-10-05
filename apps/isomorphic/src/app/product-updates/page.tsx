import type { Metadata } from 'next';
import SabyProductUpdatesPage from '@/app/shared/public-site/saby-product-updates-page';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Product Updates'),
};

export default async function ProductUpdatesPage() {
  const [initialTheme, cmsPage] = await Promise.all([
    getInitialPublicTheme('dark'),
    getPublishedCmsPage('product-updates'),
  ]);
  return <SabyProductUpdatesPage initialTheme={initialTheme} cmsPage={cmsPage} />;
}
