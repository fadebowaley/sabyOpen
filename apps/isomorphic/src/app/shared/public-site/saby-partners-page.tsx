'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Boxes,
  Building2,
  Dice5,
  Expand,
  Landmark,
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

type PartnerCard = {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  image?: { url?: string | null; alt?: string } | null;
};

const partnerCards: PartnerCard[] = [
  {
    title: 'Integration partners',
    description:
      'Connect your product to Saby. Build integrations that reach thousands of developers and creators.',
    icon: <Boxes className="h-7 w-7" />,
  },
  {
    title: 'Service partners',
    description:
      'Deliver transformation at scale. Help enterprises design, build, and ship with Saby.',
    icon: <Sparkles className="h-7 w-7" />,
  },
  {
    title: 'Agency partners',
    description:
      'Expand your offerings. Build client solutions faster and unlock new revenue streams.',
    icon: <Dice5 className="h-7 w-7" />,
  },
  {
    title: 'Startup partners',
    description:
      'For VCs, accelerators, and incubators. Give your portfolio startups the tools to build and scale faster.',
    icon: <Boxes className="h-7 w-7" />,
  },
  {
    title: 'Private equity partners',
    description:
      'Accelerate portfolio value. Modernize companies and drive digital transformation at scale.',
    icon: <Expand className="h-7 w-7" />,
  },
  {
    title: 'Government partners',
    description:
      'Modernize public services. Help agencies build citizen-facing tools and streamline operations.',
    icon: <Landmark className="h-7 w-7" />,
  },
];

type SabyPartnersPageProps = {
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

export default function SabyPartnersPage({
  initialTheme = 'dark',
  cmsPage = null,
}: SabyPartnersPageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const heroSection = findCmsSection(cmsPage, 'hero');
  const cmsEntries = getCmsEntries(cmsPage, 'partners');
  const opportunitiesSection = findCmsSection(cmsPage, 'opportunities');
  const cardsSection = findCmsSection(cmsPage, 'cards');
  const partnerIcons = [
    <Boxes className="h-7 w-7" />,
    <Sparkles className="h-7 w-7" />,
    <Dice5 className="h-7 w-7" />,
    <Expand className="h-7 w-7" />,
    <Landmark className="h-7 w-7" />,
  ];
  const renderedPartnerCards = (cmsEntries.length
    ? cmsEntries.map((item, index) => ({
        title: item.title,
        description: item.summary,
        icon: partnerIcons[index % partnerIcons.length],
        href: item.href,
        image: item.image || null,
      }))
    : cardsSection?.items?.length
    ? cardsSection.items.map((item, index) => ({
        title: cmsText(item.title, 'Partner option'),
        description: cmsText(item.description || item.summary || item.body, ''),
        icon: partnerIcons[index % partnerIcons.length],
        href: cmsText(item.href, `/partners/${item.slug || item.id || ''}`),
        image: item.image || null,
      }))
    : partnerCards);
  const heroTitle = cmsText(heroSection?.title, 'Partner with Saby');
  const heroBody = cmsText(
    heroSection?.body,
    'Want to work together? Discover partnership opportunities that spark growth, drive innovation, and turn shared ambition into shared success.'
  );
  const opportunitiesTitle = cmsText(
    opportunitiesSection?.title,
    'Discover partnership opportunities'
  );
  const opportunitiesBody = cmsText(
    opportunitiesSection?.body,
    'From integration to enterprise solutions, find the perfect partnership to grow your business.'
  );

  return (
    <div
      className={`min-h-screen ${isLightTheme ? 'bg-[#f5f5f3] text-[#14161d]' : 'bg-[#11141b] text-white'}`}
    >
      <main>
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section className="px-4 pt-1 sm:px-6 lg:px-8">
          <div
            className={`mx-auto max-w-[1560px] overflow-hidden rounded-[24px] border px-6 py-16 text-center sm:px-10 sm:py-20 ${
              isLightTheme
                ? 'border-[#d8ddd7] bg-[#f1efea]'
                : 'border-white/10 bg-[#161b24]'
            }`}
          >
            <h1
              className={`text-4xl font-semibold tracking-tight sm:text-5xl ${
                isLightTheme ? 'text-[#14161d]' : 'text-white'
              }`}
            >
              {heroTitle}
            </h1>
            <p
              className={`mx-auto mt-4 max-w-[760px] text-base leading-relaxed sm:text-lg ${
                isLightTheme ? 'text-[#535967]' : 'text-[#d2d8e7]'
              }`}
            >
              {heroBody}
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1560px]">
            <h2
              className={`text-4xl font-semibold tracking-tight sm:text-5xl ${
                isLightTheme ? 'text-[#14161d]' : 'text-white'
              }`}
            >
              {opportunitiesTitle}
            </h2>
            <p
              className={`mt-4 max-w-[760px] text-base leading-relaxed sm:text-lg ${
                isLightTheme ? 'text-[#555a65]' : 'text-[#b8bfd2]'
              }`}
            >
              {opportunitiesBody}
            </p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {renderedPartnerCards.map((card) => (
                <article
                  key={card.title}
                  className={`rounded-[22px] border p-5 sm:p-6 ${
                    isLightTheme
                      ? 'border-[#dbdeda] bg-[#f6f5f1] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]'
                      : 'border-white/10 bg-[#111722]'
                  }`}
                >
                  {getCmsImageUrl(card.image) ? (
                    <img
                      src={getCmsImageUrl(card.image)}
                      alt={card.image?.alt || card.title}
                      className="mb-5 h-36 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span
                      className={`inline-flex ${
                        isLightTheme ? 'text-[#14161d]' : 'text-[#d9e2f5]'
                      }`}
                    >
                      {card.icon}
                    </span>
                  )}
                  <h3
                    className={`mt-4 text-[1.85rem] font-semibold tracking-tight sm:text-[2rem] ${
                      isLightTheme ? 'text-[#14161d]' : 'text-white'
                    }`}
                  >
                    {card.title}
                  </h3>
                  <p
                    className={`mt-2.5 text-[1.02rem] leading-relaxed sm:text-[1.08rem] ${
                      isLightTheme ? 'text-[#4f5461]' : 'text-[#b8bfd2]'
                    }`}
                  >
                    {card.description}
                  </p>
                  <Link
                    href={card.href || '/partners'}
                    className={`mt-5 inline-flex items-center gap-1.5 text-base font-medium transition ${
                      isLightTheme
                        ? 'text-[#12151d] hover:text-[#304981]'
                        : 'text-[#d5def2] hover:text-white'
                    }`}
                  >
                    Learn more
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1560px] justify-end">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                isLightTheme
                  ? 'border-[#d4d8e3] bg-white text-[#111827] hover:bg-[#f3f6ff]'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <Building2 className="h-5 w-5" />
              Apply to partner program
            </button>
          </div>
        </section>
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/partners'}
        isLightTheme={isLightTheme}
        description="Sign in to apply and manage your partner profile."
      />
    </div>
  );
}
