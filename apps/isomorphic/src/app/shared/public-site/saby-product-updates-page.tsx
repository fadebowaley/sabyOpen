'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Calendar, CheckCircle2, Clock3, Rocket } from 'lucide-react';
import FooterSection from '@/app/shared/public-site/footer-section';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import { getCmsEntries } from '@/app/shared/public-site/cms-entry-utils';
import type { PublicCmsPage } from '@/app/shared/public-site/cms-page-types';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

type UpdateItem = {
  id: string;
  title: string;
  status: 'Shipped' | 'In Progress' | 'Planned';
  target: string;
  summary: string;
};

const updates: UpdateItem[] = [
  {
    id: 'share-ref',
    title: 'Public share references and shortcode flow',
    status: 'Shipped',
    target: 'March 2026',
    summary:
      'Published modules now support stable share references and QR-compatible short links for public access.',
  },
  {
    id: 'modal-settings',
    title: 'Landing profile and settings modal',
    status: 'In Progress',
    target: 'April 2026',
    summary:
      'Unified settings modal in landing experience with tabbed controls, persisted preferences, and rollout fallback support.',
  },
  {
    id: 'dashboard-split',
    title: 'Module dashboard performance split',
    status: 'In Progress',
    target: 'April 2026',
    summary:
      'API center heavy sections are being separated into dedicated views to improve first load and interaction speed.',
  },
  {
    id: 'billing-flow',
    title: 'Actionable upgrade and billing journey',
    status: 'Planned',
    target: 'Q2 2026',
    summary:
      'Pricing flow will move from static CTA links to a full upgrade workflow with plan selection and billing controls.',
  },
];

const statusPillClass = (status: UpdateItem['status'], isLightTheme: boolean) => {
  if (status === 'Shipped') {
    return isLightTheme
      ? 'border-[#cbe8d4] bg-[#eefaf2] text-[#1f8a4a]'
      : 'border-[#2a6240] bg-[#163324] text-[#8de3b0]';
  }
  if (status === 'In Progress') {
    return isLightTheme
      ? 'border-[#d5e2f6] bg-[#eef4ff] text-[#2b5aa7]'
      : 'border-[#2a4468] bg-[#182438] text-[#9ec1ff]';
  }
  return isLightTheme
    ? 'border-[#e4ddcc] bg-[#faf6ea] text-[#8a6a20]'
    : 'border-[#5c4b23] bg-[#302711] text-[#e1c37d]';
};

type SabyProductUpdatesPageProps = {
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

export default function SabyProductUpdatesPage({
  initialTheme = 'dark',
  cmsPage = null,
}: SabyProductUpdatesPageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const heroSection = cmsPage?.sections?.find((section) => section.type === 'hero');
  const cmsEntries = getCmsEntries(cmsPage, 'product-updates');
  const updateSection = cmsPage?.sections?.find((section) => section.id === 'updates' || section.type === 'cards');
  const cmsUpdates = (cmsEntries.length ? cmsEntries : updateSection?.items || [])
    .filter((item) => item?.title)
    .map((item, index) => ({
      id: item.id || `cms-update-${index}`,
      href: item.href || `/product-updates/${item.slug || item.id || `update-${index + 1}`}`,
      title: item.title || '',
      status: ['Shipped', 'In Progress', 'Planned'].includes(item.status || '')
        ? (item.status as UpdateItem['status'])
        : 'Planned',
      target: item.target || 'Upcoming',
      summary: item.summary || '',
    }));
  const renderedUpdates = cmsUpdates.length
    ? cmsUpdates
    : updates.map((item) => ({ ...item, href: '/product-updates' }));
  const heroEyebrow = heroSection?.subtitle || 'Product updates';
  const heroTitle =
    heroSection?.title || 'What we shipped and what is coming next';
  const heroBody =
    heroSection?.body ||
    'This roadmap is focused on module operations, public sharing, settings experience, and enterprise readiness.';

  return (
    <div
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#0f141d] text-white'
      }`}
    >
      <main>
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[860px]">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                  isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9db0d1]'
                }`}
              >
                {heroEyebrow}
              </p>
              <h1
                className={`mt-4 text-4xl font-semibold tracking-tight sm:text-5xl ${
                  isLightTheme ? 'text-[#111827]' : 'text-white'
                }`}
              >
                {heroTitle}
              </h1>
              <p
                className={`mt-4 text-base leading-relaxed sm:text-lg ${
                  isLightTheme ? 'text-[#4f607f]' : 'text-[#bdc7dc]'
                }`}
              >
                {heroBody}
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              {renderedUpdates.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`rounded-2xl border p-5 ${
                    isLightTheme
                      ? 'border-[#d6dfef] bg-white'
                      : 'border-white/10 bg-[#141b27]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold">{item.title}</p>
                      <p
                        className={`mt-2 text-sm leading-relaxed ${
                          isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                        }`}
                      >
                        {item.summary}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(
                        item.status,
                        isLightTheme
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div
                    className={`mt-4 flex items-center gap-2 text-sm ${
                      isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>{item.target}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div
                className={`rounded-2xl border p-5 ${
                  isLightTheme
                    ? 'border-[#d6dfef] bg-white'
                    : 'border-white/10 bg-[#141b27]'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Shipped reliability
                </div>
                <p
                  className={`mt-2 text-sm ${
                    isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                  }`}
                >
                  Public module access and shared shortcode delivery are now stable for rollout.
                </p>
              </div>
              <div
                className={`rounded-2xl border p-5 ${
                  isLightTheme
                    ? 'border-[#d6dfef] bg-white'
                    : 'border-white/10 bg-[#141b27]'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock3 className="h-4 w-4" />
                  Current focus
                </div>
                <p
                  className={`mt-2 text-sm ${
                    isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                  }`}
                >
                  Performance optimization and settings standardization across landing and module flows.
                </p>
              </div>
              <div
                className={`rounded-2xl border p-5 ${
                  isLightTheme
                    ? 'border-[#d6dfef] bg-white'
                    : 'border-white/10 bg-[#141b27]'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Rocket className="h-4 w-4" />
                  Next release
                </div>
                <p
                  className={`mt-2 text-sm ${
                    isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                  }`}
                >
                  Upgrade plan and billing flow hardening with a complete enterprise-ready purchase journey.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/help"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isLightTheme
                    ? 'border-[#c7d4ec] bg-white text-[#1e4294] hover:bg-[#eef3ff]'
                    : 'border-white/20 bg-white/5 text-[#d7e3ff] hover:bg-white/10'
                }`}
              >
                <span>Open help center</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="/pricing"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isLightTheme
                    ? 'border-[#d6dfef] bg-white text-[#23395f] hover:bg-[#f2f6ff]'
                    : 'border-white/15 bg-[#1a2333] text-[#d7e3ff] hover:bg-[#222f44]'
                }`}
              >
                <span>View plans</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <FooterSection variant="landing" isLightTheme={isLightTheme} />
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/product-updates'}
        isLightTheme={isLightTheme}
        description="Sign in to continue with plan updates, release notes, and product rollout access."
      />
    </div>
  );
}
