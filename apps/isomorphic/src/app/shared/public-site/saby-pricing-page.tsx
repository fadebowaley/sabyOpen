'use client';

import { useState } from 'react';
import FooterSection from '@/app/shared/public-site/footer-section';
import SabyFaqSection from '@/app/shared/public-site/saby-faq-section';
import SabyPricingCtaSection from '@/app/shared/public-site/saby-pricing-cta-section';
import SabyPricingSection, {
  type PricingBillingPeriod,
} from '@/app/shared/public-site/saby-pricing-section';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import {
  type SabyBillingPeriod,
} from '@/app/shared/public-site/saby-pricing-plans';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

export default function SabyPricingPage({
  initialTheme = 'dark',
}: {
  initialTheme?: PublicThemeMode;
}) {
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });

  const [billingPeriod, setBillingPeriod] = useState<PricingBillingPeriod>('monthly');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f5f5f3]' : 'bg-[#10141d] text-white'
      }`}
    >
      <main>
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <SabyPricingSection
          isLightTheme={isLightTheme}
          billingPeriod={billingPeriod}
          onBillingPeriodChange={setBillingPeriod}
        />

        <SabyFaqSection isLightTheme={isLightTheme} />

        <SabyPricingCtaSection
          isLightTheme={isLightTheme}
        />

        <FooterSection variant="landing" isLightTheme={isLightTheme} />
      </main>
      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath="/pricing"
        isLightTheme={isLightTheme}
        description="Sign in or create an account to continue with pricing, checkout, and workspace setup."
      />
    </div>
  );
}
