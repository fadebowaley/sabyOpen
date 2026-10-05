import type { Metadata } from 'next';
import SabyDocumentationPage from '@/app/shared/public-site/saby-documentation-page';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Documentation'),
};

export default async function DocumentationPage() {
  const [initialTheme, cmsPage] = await Promise.all([
    getInitialPublicTheme('dark'),
    getPublishedCmsPage('documentation'),
  ]);
  return <SabyDocumentationPage initialTheme={initialTheme} cmsPage={cmsPage} />;
}
