import type { Metadata } from 'next';
import SabyBillingPage from '@/app/shared/public-site/saby-billing-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Billing'),
};

export default async function BillingPage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyBillingPage initialTheme={initialTheme} />;
}
