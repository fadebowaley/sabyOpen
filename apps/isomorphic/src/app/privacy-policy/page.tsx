import type { Metadata } from 'next';
import SabyPrivacyPolicyPage from '@/app/shared/public-site/saby-privacy-policy-page';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Privacy Policy'),
};

export default async function PrivacyPolicyPage() {
  const [initialTheme, cmsPage] = await Promise.all([
    getInitialPublicTheme('dark'),
    getPublishedCmsPage('privacy-policy'),
  ]);
  return <SabyPrivacyPolicyPage initialTheme={initialTheme} cmsPage={cmsPage} />;
}
