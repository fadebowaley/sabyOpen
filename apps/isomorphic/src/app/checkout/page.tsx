import type { Metadata } from 'next';
import SabyCheckoutPage from '@/app/shared/public-site/saby-checkout-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Checkout'),
};

export default async function CheckoutPage() {
  const initialTheme = await getInitialPublicTheme('dark');
  return <SabyCheckoutPage initialTheme={initialTheme} />;
}
