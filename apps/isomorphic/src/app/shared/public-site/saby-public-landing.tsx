'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import FooterSection from '@/app/shared/public-site/footer-section';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import SabyFaqSection from '@/app/shared/public-site/saby-faq-section';
import SabyMeetSection from '@/app/shared/public-site/saby-meet-section';
import IntegrationsSection from '@/app/shared/public-site/IntegrationsSection';
import SabyPricingCtaSection from '@/app/shared/public-site/saby-pricing-cta-section';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import TrustedByCompanies from '@/app/shared/public-site/TrustedByCompanies';
import WorkflowTemplatesSection from '@/app/shared/public-site/WorkflowTemplatesSection';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';
import { publicSiteTheme } from './public-theme-classes';

const capabilityCards = [
  {
    title: 'Agent-guided operations',
    description:
      'Launch user, workflow, and compliance actions through a guided assistant without losing control of the underlying process.',
    icon: Bot,
  },
  {
    title: 'Structured workflows',
    description:
      'Turn forms, approvals, and reporting flows into reusable operational systems that scale across teams and branches.',
    icon: ShieldCheck,
  },
  {
    title: 'Operational chat',
    description:
      'Use the dedicated Saby chat route for live assistance, guided actions, and faster execution after you sign in.',
    icon: MessageSquareText,
  },
];

const statHighlights = [
  'Form-driven operations',
  'Compliance-ready reporting',
  'Multi-tenant orchestration',
  'AI-assisted execution',
];

export default function SabyPublicLanding({
  initialTheme = 'dark',
}: {
  initialTheme?: PublicThemeMode;
}) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isLightTheme
          ? `${publicSiteTheme.light.pageBg} ${publicSiteTheme.light.pageText}`
          : 'bg-[#070b12] text-white'
      }`}
    >
      <main>
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section
          className={`relative overflow-hidden px-4 pb-18 pt-8 sm:px-6 sm:pb-24 lg:px-8 ${
            isLightTheme ? publicSiteTheme.light.pageBg : 'bg-[#070b12]'
          }`}
        >
          <div
            className={`pointer-events-none absolute inset-0 ${
              isLightTheme
                ? 'bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.12),rgba(245,245,243,0)_30%),radial-gradient(circle_at_82%_14%,rgba(29,78,216,0.12),rgba(245,245,243,0)_28%)]'
                : 'bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.22),rgba(7,11,18,0)_30%),radial-gradient(circle_at_82%_14%,rgba(59,130,246,0.22),rgba(7,11,18,0)_28%),linear-gradient(180deg,#070b12_0%,#0b1220_62%,#101828_100%)]'
            }`}
          />

          <div className="relative mx-auto max-w-[1180px]">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-[680px]">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                    isLightTheme
                      ? 'border-[#d9e3f4] bg-white text-[#31538e]'
                      : 'border-white/10 bg-white/5 text-[#9fb8e8]'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  Saby operations intelligence
                </div>

                <h1
                  className={`mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl ${
                    isLightTheme ? 'text-[#0f172a]' : 'text-white'
                  }`}
                >
                  Turn forms, workflows, and approvals into one operational
                  command layer.
                </h1>

                <p
                  className={`mt-5 max-w-[620px] text-base leading-8 sm:text-lg ${
                    isLightTheme ? 'text-[#52627f]' : 'text-[#c3ccdd]'
                  }`}
                >
                  Saby helps teams capture field data, enforce reporting
                  standards, and execute guided actions through a unified
                  assistant and workspace.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b1220]"
                  >
                    Sign in to continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <Link
                    href="/"
                    className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition ${
                      isLightTheme
                        ? 'border-[#cfdcf0] bg-white text-[#1f2b45] hover:border-[#8fb2eb] hover:text-[#111827]'
                        : 'border-white/10 bg-white/5 text-white hover:border-[#4b6fb0] hover:bg-white/10'
                    }`}
                  >
                    Open Saby chat
                    <MessageSquareText className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  {statHighlights.map((item) => (
                    <div
                      key={item}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                        isLightTheme
                          ? 'bg-white text-[#31405c] shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
                          : 'bg-white/5 text-[#d8deeb] ring-1 ring-white/10'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#4d81bd]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] ${
                  isLightTheme
                    ? 'border-[#d9e3f4] bg-white'
                    : 'border-white/10 bg-[#101826]/90'
                }`}
              >
                <div className="grid gap-4">
                  {capabilityCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article
                        key={card.title}
                        className={`rounded-[1.4rem] border p-5 ${
                          isLightTheme
                            ? 'border-[#e3ebf8] bg-[#f8fbff]'
                            : 'border-white/10 bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span
                            className={`mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                              isLightTheme
                                ? 'bg-white text-[#31538e] shadow-sm'
                                : 'bg-[#182235] text-[#b8ccf2]'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                          <div>
                            <h2
                              className={`text-lg font-semibold ${
                                isLightTheme ? 'text-[#111827]' : 'text-white'
                              }`}
                            >
                              {card.title}
                            </h2>
                            <p
                              className={`mt-2 text-sm leading-7 ${
                                isLightTheme
                                  ? 'text-[#55657f]'
                                  : 'text-[#c0cadb]'
                              }`}
                            >
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustedByCompanies isLightTheme={isLightTheme} />
        <WorkflowTemplatesSection isLightTheme={isLightTheme} />
        <IntegrationsSection isLightTheme={isLightTheme} />
        <SabyMeetSection isLightTheme={isLightTheme} />
        <SabyFaqSection isLightTheme={isLightTheme} />
        <SabyPricingCtaSection
          isLightTheme={isLightTheme}
          onCtaClick={() => setIsAuthModalOpen(true)}
        />
        <FooterSection variant="landing" isLightTheme={isLightTheme} />
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/'}
        isLightTheme={isLightTheme}
        description="Sign in to continue into Saby."
      />
    </div>
  );
}
