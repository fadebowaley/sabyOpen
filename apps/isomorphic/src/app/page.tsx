import type { Metadata } from 'next';
import { metaObject } from '@/config/site.config';
import SabyChatLanding from '@/app/shared/public-site/saby-chat-landing';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';

export const metadata: Metadata = {
  ...metaObject('Saby Chat'),
};

export default async function HomePage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyChatLanding mode="chat" initialTheme={initialTheme} />;
}
