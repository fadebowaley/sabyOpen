import type { Metadata } from 'next';
import SabyCheckoutReturnPage from '@/app/shared/public-site/saby-checkout-return-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Payment Return'),
};

export default async function CheckoutReturnPage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyCheckoutReturnPage initialTheme={initialTheme} />;
}
