import type { Metadata } from 'next';
import SabyPricingPage from '@/app/shared/public-site/saby-pricing-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Pricing'),
};

export default async function PricingPage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyPricingPage initialTheme={initialTheme} />;
}
