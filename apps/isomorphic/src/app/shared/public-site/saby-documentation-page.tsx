'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  FileCode2,
  Rocket,
  Sparkles,
} from 'lucide-react';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import { getCmsEntries } from '@/app/shared/public-site/cms-entry-utils';
import {
  cmsText,
  findCmsSection,
  getCmsImageUrl,
  type PublicCmsPage,
} from '@/app/shared/public-site/cms-page-types';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

type DocCard = {
  title: string;
  description: string;
  href: string;
  badge: string;
  image?: { url?: string | null; alt?: string } | null;
};

const featuredDocs: DocCard[] = [
  {
    title: 'Data Ingestion Quickstart',
    description:
      'Connect forms, APIs, and storage in minutes with guided setup and production-ready defaults.',
    href: '/documentation',
    badge: 'Quickstart',
  },
  {
    title: 'Operational Dashboards',
    description:
      'Build role-specific dashboards with templates for finance, compliance, and operational teams.',
    href: '/documentation',
    badge: 'Templates',
  },
];

const docLinks = [
  {
    title: 'API Reference',
    icon: <FileCode2 className="h-5 w-5" />,
    summary: 'Endpoints, authentication, and request examples.',
    href: '/documentation',
  },
  {
    title: 'How-to Guides',
    icon: <BookOpenText className="h-5 w-5" />,
    summary: 'Step-by-step playbooks for implementation teams.',
    href: '/documentation',
  },
  {
    title: 'Launch Checklist',
    icon: <Rocket className="h-5 w-5" />,
    summary: 'Pre-launch and post-launch checks for reliability.',
    href: '/documentation',
  },
  {
    title: 'Best Practices',
    icon: <Sparkles className="h-5 w-5" />,
    summary: 'Design, governance, and reporting recommendations.',
    href: '/documentation',
  },
];

type SabyDocumentationPageProps = {
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

export default function SabyDocumentationPage({
  initialTheme = 'dark',
  cmsPage = null,
}: SabyDocumentationPageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const heroSection = findCmsSection(cmsPage, 'hero');
  const cmsEntries = getCmsEntries(cmsPage, 'documentation');
  const featuredSection = findCmsSection(cmsPage, 'featured');
  const linksSection = findCmsSection(cmsPage, 'links');
  const renderedFeaturedDocs = (cmsEntries.length
    ? cmsEntries.slice(0, 2).map((item) => ({
        title: item.title,
        description: item.summary,
        href: item.href,
        badge: cmsText(item.badge || item.category, 'Guide'),
        image: item.image || null,
      }))
    : featuredSection?.items?.length
    ? featuredSection.items.map((item) => ({
        title: cmsText(item.title, 'Documentation guide'),
        description: cmsText(item.description || item.summary || item.body, ''),
        href: cmsText(item.href, `/documentation/${item.slug || item.id || ''}`),
        badge: cmsText(item.badge, 'Guide'),
        image: item.image || null,
      }))
    : featuredDocs);
  const linkIcons = [
    <FileCode2 className="h-5 w-5" />,
    <BookOpenText className="h-5 w-5" />,
    <Rocket className="h-5 w-5" />,
    <Sparkles className="h-5 w-5" />,
  ];
  const renderedDocLinks = (cmsEntries.length > 2
    ? cmsEntries.slice(2).map((item, index) => ({
        title: item.title,
        summary: item.summary,
        href: item.href,
        icon: linkIcons[index % linkIcons.length],
      }))
    : linksSection?.items?.length
    ? linksSection.items.map((item, index) => ({
        title: cmsText(item.title, 'Documentation link'),
        summary: cmsText(item.summary || item.description || item.body, ''),
        href: cmsText(item.href, `/documentation/${item.slug || item.id || ''}`),
        icon: linkIcons[index % linkIcons.length],
      }))
    : docLinks);
  const heroLabel = cmsText(heroSection?.subtitle, 'Documentation');
  const heroTitle = cmsText(heroSection?.title, 'Build and ship with confidence');
  const heroBody = cmsText(
    heroSection?.body,
    'Setup guides, API references, and architecture patterns for teams building with Saby.'
  );

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#11141b] text-white'
      }`}
    >
      <main className="relative z-[1]">
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section className="px-4 pb-16 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1260px]">
            <div className="max-w-[760px]">
              <p
                className={`text-sm uppercase tracking-[0.18em] ${
                  isLightTheme ? 'text-[#5f6f8d]' : 'text-[#aeb6ca]'
                }`}
              >
                {heroLabel}
              </p>
              <h1
                className={`mt-3 text-4xl font-semibold tracking-tight sm:text-5xl ${
                  isLightTheme ? 'text-[#111827]' : 'text-white'
                }`}
              >
                {heroTitle}
              </h1>
              <p
                className={`mt-4 max-w-[680px] text-base leading-relaxed sm:text-lg ${
                  isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                }`}
              >
                {heroBody}
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {renderedFeaturedDocs.map((doc, index) => (
                <article
                  key={doc.title}
                  className={`overflow-hidden rounded-2xl border ${
                    isLightTheme
                      ? 'border-[#d9e2f2] bg-white'
                      : 'border-white/10 bg-[#171b24]'
                  }`}
                >
                  {getCmsImageUrl(doc.image) ? (
                    <img
                      src={getCmsImageUrl(doc.image)}
                      alt={doc.image?.alt || doc.title}
                      className="h-[260px] w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-[260px] ${
                        index === 1
                          ? isLightTheme
                            ? 'bg-[#ece8df]'
                            : 'bg-[#1e242f]'
                          : isLightTheme
                            ? 'bg-[#e8e4dc]'
                            : 'bg-[#1a202a]'
                      }`}
                    />
                  )}

                  <div className="p-5 sm:p-6">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        isLightTheme
                          ? 'bg-[#eef3ff] text-[#1f3a74]'
                          : 'bg-white/10 text-white/90'
                      }`}
                    >
                      {doc.badge}
                    </span>
                    <h2
                      className={`mt-3 text-3xl font-semibold leading-tight ${
                        isLightTheme ? 'text-[#111827]' : ''
                      }`}
                    >
                      {doc.title}
                    </h2>
                    <p
                      className={`mt-3 text-base leading-relaxed ${
                        isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                      }`}
                    >
                      {doc.description}
                    </p>
                    <Link
                      href={doc.href}
                      className={`mt-5 inline-flex items-center gap-1.5 text-sm font-medium transition ${
                        isLightTheme
                          ? 'text-[#1d4ed8] hover:text-[#1e40af]'
                          : 'text-white hover:text-[#d5ddf5]'
                      }`}
                    >
                      Read guide
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {renderedDocLinks.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`rounded-2xl border p-4 transition ${
                    isLightTheme
                      ? 'border-[#d9e2f2] bg-white hover:border-[#c3d2ea] hover:bg-[#f8fbff]'
                      : 'border-white/10 bg-[#171b24] hover:border-white/20 hover:bg-[#1c212e]'
                  }`}
                >
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      isLightTheme
                        ? 'bg-[#eef3ff] text-[#1f3a74]'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <h3
                    className={`mt-4 text-xl font-semibold ${
                      isLightTheme ? 'text-[#111827]' : ''
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                    }`}
                  >
                    {item.summary}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/documentation'}
        isLightTheme={isLightTheme}
        description="Sign in to open documentation examples in your workspace."
      />
    </div>
  );
}
