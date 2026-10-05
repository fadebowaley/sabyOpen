import type { Metadata } from 'next';
import { metaObject } from '@/config/site.config';
import SabyMeetPageClient from '@/app/shared/public-site/saby-meet-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';

export const metadata: Metadata = {
  ...metaObject('Meet Saby'),
};

export default async function SabyMeetPage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyMeetPageClient initialTheme={initialTheme} />;
}
