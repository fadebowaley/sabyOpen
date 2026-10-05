'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CalendarDays, Clock3, MessageCircle, Share2 } from 'lucide-react';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import type { PublicCmsEntry } from '@/app/shared/public-site/cms-entry-utils';
import { getCmsImageUrl } from '@/app/shared/public-site/cms-page-types';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

type SabyCmsEntryDetailPageProps = {
  entry: PublicCmsEntry;
  collectionTitle: string;
  basePath: string;
  initialTheme?: PublicThemeMode;
};

export default function SabyCmsEntryDetailPage({
  entry,
  collectionTitle,
  basePath,
  initialTheme = 'dark',
}: SabyCmsEntryDetailPageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const fallbackParagraphs = entry.paragraphs?.length
    ? entry.paragraphs
    : [entry.body || entry.description || entry.summary || entry.contentText || 'This content is managed from Saby CMS.'].filter(Boolean);

  return (
    <div
      className={`relative min-h-screen overflow-hidden ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#0c111b] text-white'
      }`}
    >
      <main className="relative z-[1]">
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1180px]">
            <Link
              href={basePath}
              className={`inline-flex items-center gap-2 text-sm font-semibold transition ${
                isLightTheme
                  ? 'text-[#5f6f8d] hover:text-[#111827]'
                  : 'text-[#c5ccdd] hover:text-white'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {collectionTitle}
            </Link>

            <article className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {entry.category ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        isLightTheme
                          ? 'border-[#d9e2f2] bg-white text-[#2d4c85]'
                          : 'border-white/15 bg-white/5 text-[#d7def0]'
                      }`}
                    >
                      {entry.category}
                    </span>
                  ) : null}
                  {entry.badge ? (
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        isLightTheme
                          ? 'border-[#d8d1bd] bg-[#faf6ea] text-[#806015]'
                          : 'border-[#5c4b23] bg-[#302711] text-[#e1c37d]'
                      }`}
                    >
                      {entry.badge}
                    </span>
                  ) : null}
                </div>

                <h1
                  className={`mt-5 max-w-[18ch] text-[2.75rem] font-semibold leading-[1.08] tracking-tight sm:text-[3.35rem] ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  {entry.title}
                </h1>

                {entry.lead || entry.summary ? (
                  <p
                    className={`mt-6 max-w-[760px] text-[1.35rem] leading-relaxed ${
                      isLightTheme ? 'text-[#2d3f5f]' : 'text-[#d2d9ea]'
                    }`}
                  >
                    {entry.lead || entry.summary}
                  </p>
                ) : null}

                {entry.tags?.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          isLightTheme
                            ? 'border-[#d9e2f2] bg-white text-[#52627f]'
                            : 'border-white/15 bg-white/5 text-[#cbd4e8]'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {getCmsImageUrl(entry.image) ? (
                  <figure className="mt-8">
                    <div
                      className={`overflow-hidden rounded-2xl border ${
                        isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                      }`}
                    >
                      <img
                        src={getCmsImageUrl(entry.image)}
                        alt={entry.image?.alt || entry.title}
                        className="h-[420px] w-full object-cover"
                      />
                    </div>
                    {entry.image?.caption ? (
                      <figcaption
                        className={`mt-2 text-sm ${
                          isLightTheme ? 'text-[#60718f]' : 'text-[#9ca8c1]'
                        }`}
                      >
                        {entry.image?.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ) : null}

                {entry.contentHtml ? (
                  <div
                    className={`saby-rich-content mt-10 text-[1.05rem] ${
                      isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                    }`}
                    dangerouslySetInnerHTML={{ __html: entry.contentHtml }}
                  />
                ) : (
                  <div className="mt-10 space-y-4">
                    {fallbackParagraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 48)}
                        className={`text-[1.05rem] leading-relaxed ${
                          isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                        }`}
                      >
                        {paragraph}
                      </p>
                    ))}
                    {entry.bullets?.length ? (
                      <ul
                        className={`list-disc space-y-2 pl-6 text-[1.02rem] ${
                          isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                        }`}
                      >
                        {entry.bullets.map((item) => (
                          <li key={item.slice(0, 48)}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )}
              </div>

              <aside
                className={`rounded-2xl border p-5 lg:sticky lg:top-20 lg:h-fit ${
                  isLightTheme
                    ? 'border-[#d9e2f2] bg-white'
                    : 'border-white/10 bg-[#111722]'
                }`}
              >
                <p
                  className={`text-[0.82rem] uppercase tracking-[0.18em] ${
                    isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9ca8c1]'
                  }`}
                >
                  Details
                </p>
                <div className="mt-4 space-y-3">
                  {entry.publishedOn ? (
                    <p className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4" />
                      {entry.publishedOn}
                    </p>
                  ) : null}
                  {entry.readTime ? (
                    <p className="flex items-center gap-2 text-sm">
                      <Clock3 className="h-4 w-4" />
                      {entry.readTime}
                    </p>
                  ) : null}
                  {entry.author ? <p className="text-sm">By {entry.author}</p> : null}
                </div>

                <div
                  className={`my-5 border-t ${
                    isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                  }`}
                />

                <p className="text-sm font-semibold">Share this</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      isLightTheme
                        ? 'border-[#d9e2f2] text-[#1d4ed8] hover:bg-[#eef3ff]'
                        : 'border-white/20 text-[#d8dff1] hover:bg-white/10'
                    }`}
                    aria-label="Share to community"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                      isLightTheme
                        ? 'border-[#d9e2f2] text-[#1d4ed8] hover:bg-[#eef3ff]'
                        : 'border-white/20 text-[#d8dff1] hover:bg-white/10'
                    }`}
                    aria-label="Share content"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </aside>
            </article>
          </div>
        </section>
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || `${basePath}/${entry.slug}`}
        isLightTheme={isLightTheme}
        description="Sign in to save this content and continue in your workspace."
      />
    </div>
  );
}
