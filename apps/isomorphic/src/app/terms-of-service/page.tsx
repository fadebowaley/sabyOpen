import type { Metadata } from 'next';
import SabyTermsOfServicePage from '@/app/shared/public-site/saby-terms-of-service-page';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Terms of Service'),
};

export default async function TermsOfServicePage() {
  const [initialTheme, cmsPage] = await Promise.all([
    getInitialPublicTheme('dark'),
    getPublishedCmsPage('terms-of-service'),
  ]);
  return <SabyTermsOfServicePage initialTheme={initialTheme} cmsPage={cmsPage} />;
}
