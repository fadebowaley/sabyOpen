import type { Metadata } from 'next';
import SabyHelpSupportPage from '@/app/shared/public-site/saby-help-support-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Help and Support'),
};

export default async function HelpSupportPage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyHelpSupportPage initialTheme={initialTheme} />;
}
