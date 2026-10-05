'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import FooterSection from '@/app/shared/public-site/footer-section';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import SabyFaqSection from '@/app/shared/public-site/saby-faq-section';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import { usePublicTheme } from '@/app/shared/public-site/use-public-theme';

export default function FAQsPage() {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme('light', {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#10141d] text-white'
      }`}
    >
      <SabyPublicNavbar
        isLightTheme={isLightTheme}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onToggleTheme={toggleTheme}
      />

      <main>
        <SabyFaqSection isLightTheme={isLightTheme} />
        <FooterSection variant="landing" isLightTheme={isLightTheme} />
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/faqs'}
        isLightTheme={isLightTheme}
        description="Sign in or create an account to continue with Saby workspace, billing, and support actions."
      />
    </div>
  );
}
