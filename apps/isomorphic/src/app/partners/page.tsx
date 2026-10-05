import type { Metadata } from 'next';
import SabyPartnersPage from '@/app/shared/public-site/saby-partners-page';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Partners'),
};

export default async function PartnersPage() {
  const [initialTheme, cmsPage] = await Promise.all([
    getInitialPublicTheme('dark'),
    getPublishedCmsPage('partners'),
  ]);
  return <SabyPartnersPage initialTheme={initialTheme} cmsPage={cmsPage} />;
}
