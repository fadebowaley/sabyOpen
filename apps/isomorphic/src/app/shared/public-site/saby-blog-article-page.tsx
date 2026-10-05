'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ChevronLeft, MessageCircle, Share2 } from 'lucide-react';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import { findCmsEntryBySlug, getCmsEntries } from '@/app/shared/public-site/cms-entry-utils';
import {
  cmsItemSlug,
  sanitizeCmsHtml,
  cmsText,
  getCmsImageUrl,
  type PublicCmsItem,
  type PublicCmsPage,
} from '@/app/shared/public-site/cms-page-types';
import type { SabyBlogArticle } from '@/app/shared/public-site/saby-blog-content';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

const toAnchorId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type SabyBlogArticlePageProps = {
  slug: string;
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

const cmsArticleToBlogArticle = (
  item: PublicCmsItem,
  fallbackSlug: string
): SabyBlogArticle => {
  const articleSlug = cmsItemSlug(item) || fallbackSlug;
  const bodyParagraphs = item.paragraphs?.filter(Boolean) || [];
  const bodyText = cmsText(item.body || item.description || item.summary, '');
  const sections =
    bodyParagraphs.length || item.bullets?.length
      ? [
          {
            heading: 'Article',
            paragraphs: bodyParagraphs.length
              ? bodyParagraphs
              : bodyText
                ? [bodyText]
                : [cmsText(item.lead, 'This article is managed from Saby CMS.')],
            bullets: item.bullets?.filter(Boolean),
          },
        ]
      : [
          {
            heading: 'Overview',
            paragraphs: [
              bodyText || cmsText(item.lead, 'This article is managed from Saby CMS.'),
            ],
          },
        ];

  return {
    slug: articleSlug,
    category: cmsText(item.category, 'Announcements'),
    title: cmsText(item.title, 'Saby update'),
    summary: cmsText(item.summary || item.description || item.body, ''),
    author: cmsText(item.author, 'Saby Product'),
    publishedOn: cmsText(item.publishedOn, ''),
    readTime: cmsText(item.readTime, '3 min read'),
    lead: cmsText(item.lead || item.summary || item.description || item.body, ''),
    image: item.image || null,
    contentHtml: sanitizeCmsHtml(item.contentHtml),
    contentText: cmsText(item.contentText, ''),
    sections,
  };
};

export default function SabyBlogArticlePage({
  slug,
  initialTheme = 'dark',
  cmsPage = null,
}: SabyBlogArticlePageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const article = useMemo(() => {
    const cmsArticle = findCmsEntryBySlug(cmsPage, 'blog', slug);

    return cmsArticle ? cmsArticleToBlogArticle(cmsArticle, slug) : null;
  }, [cmsPage, slug]);

  const relatedArticles = useMemo(
    () => {
      const cmsArticles = getCmsEntries(cmsPage, 'blog');
      const mappedCmsArticles = cmsArticles
        .filter((item) => item.slug !== article?.slug && item.title)
        .map((item) => cmsArticleToBlogArticle(item, item.slug))
        .slice(0, 2);

      return mappedCmsArticles;
    },
    [article?.slug, cmsPage]
  );

  if (!article) {
    return null;
  }

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
          <div className="mx-auto max-w-[1260px]">
            <Link
              href="/blog"
              className={`inline-flex items-center gap-1.5 text-[0.95rem] transition ${
                isLightTheme
                  ? 'text-[#5f6f8d] hover:text-[#111827]'
                  : 'text-[#c5ccdd] hover:text-white'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              All posts
            </Link>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <article>
                <p
                  className={`text-sm ${
                    isLightTheme ? 'text-[#5f6f8d]' : 'text-[#b6bed2]'
                  }`}
                >
                  Published {article.publishedOn} in {article.category}
                </p>
                <h1
                  className={`mt-4 max-w-[15ch] text-[2.8rem] font-semibold leading-[1.08] tracking-tight sm:text-[3.4rem] ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  {article.title}
                </h1>

                <div
                  className={`mt-7 overflow-hidden rounded-2xl border ${
                    isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                  }`}
                >
                  {getCmsImageUrl(article.image) ? (
                    <img
                      src={getCmsImageUrl(article.image)}
                      alt={article.image?.alt || article.title}
                      className="h-[420px] w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-[420px] ${
                        isLightTheme
                          ? 'bg-[#e8e4dc]'
                          : 'bg-[#1a202a]'
                      }`}
                    />
                  )}
                </div>
                {article.image?.caption ? (
                  <p
                    className={`mt-2 text-sm ${
                      isLightTheme ? 'text-[#60718f]' : 'text-[#9ca8c1]'
                    }`}
                  >
                    {article.image.caption}
                  </p>
                ) : null}

                <p
                  className={`mt-4 text-lg ${
                    isLightTheme ? 'text-[#47597a]' : 'text-[#d7deef]'
                  }`}
                >
                  Author: {article.author}
                </p>
                <p
                  className={`mt-8 text-[1.5rem] leading-relaxed ${
                    isLightTheme ? 'text-[#2d3f5f]' : 'text-[#d2d9ea]'
                  }`}
                >
                  {article.lead}
                </p>

                {article.contentHtml ? (
                  <div
                    className={`saby-rich-content mt-10 text-[1.05rem] ${
                      isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                    }`}
                    dangerouslySetInnerHTML={{ __html: article.contentHtml }}
                  />
                ) : (
                  <div className="mt-10 space-y-10">
                    {article.sections.map((section) => (
                      <section
                        key={section.heading}
                        id={toAnchorId(section.heading)}
                      >
                        <h2
                          className={`text-[1.95rem] font-semibold leading-tight ${
                            isLightTheme ? 'text-[#111827]' : 'text-white'
                          }`}
                        >
                          {section.heading}
                        </h2>
                        <div className="mt-3 space-y-3">
                          {section.paragraphs.map((line) => (
                            <p
                              key={`${section.heading}-${line}`}
                              className={`text-[1.05rem] leading-relaxed ${
                                isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                              }`}
                            >
                              {line}
                            </p>
                          ))}
                        </div>

                        {section.bullets?.length ? (
                          <ul
                            className={`mt-4 list-disc space-y-2 pl-6 text-[1.02rem] ${
                              isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                            }`}
                          >
                            {section.bullets.map((item) => (
                              <li key={`${section.heading}-bullet-${item}`}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </section>
                    ))}
                  </div>
                )}

                <section className="mt-16">
                  <h2
                    className={`text-4xl font-semibold tracking-tight sm:text-5xl ${
                      isLightTheme ? 'text-[#111827]' : 'text-white'
                    }`}
                  >
                    Related articles
                  </h2>
                  <div className="mt-7 grid gap-6 md:grid-cols-2">
                    {relatedArticles.map((item, index) => (
                      <Link
                        key={item.slug}
                        href={`/blog/${item.slug}`}
                        className="group block"
                      >
                        <div
                          className={`h-[240px] overflow-hidden rounded-xl border ${
                            isLightTheme
                              ? 'border-[#d9e2f2]'
                              : 'border-white/10'
                          }`}
                        >
                          {getCmsImageUrl(item.image) ? (
                            <img
                              src={getCmsImageUrl(item.image)}
                              alt={item.image?.alt || item.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className={`h-full w-full ${
                                index === 0
                                  ? isLightTheme
                                    ? 'bg-[#ece8df]'
                                    : 'bg-[#1a202a]'
                                  : isLightTheme
                                    ? 'bg-[#e6e2d9]'
                                    : 'bg-[#202735]'
                              }`}
                            />
                          )}
                        </div>
                        <p
                          className={`mt-3 text-sm lowercase ${
                            isLightTheme ? 'text-[#5f6f8d]' : 'text-[#b6bed2]'
                          }`}
                        >
                          {item.category}
                        </p>
                        <h3
                          className={`mt-1 text-3xl font-semibold leading-tight transition ${
                            isLightTheme
                              ? 'text-[#0f172a] group-hover:text-[#1d4ed8]'
                              : 'group-hover:text-[#d7e0f4]'
                          }`}
                        >
                          {item.title}
                        </h3>
                        <p
                          className={`mt-2 text-base ${
                            isLightTheme ? 'text-[#60718f]' : 'text-[#c3cbdd]'
                          }`}
                        >
                          {item.publishedOn}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>

                <section
                  className={`mt-12 overflow-hidden rounded-2xl border p-8 text-center ${
                    isLightTheme
                      ? 'border-[#d9e2f2] bg-[#efebe3]'
                      : 'border-white/10 bg-[#1a212d]'
                  }`}
                >
                  <p
                    className={`text-sm uppercase tracking-[0.2em] ${
                      isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9eabca]'
                    }`}
                  >
                    Build with Saby
                  </p>
                  <h3
                    className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${
                      isLightTheme ? 'text-[#111827]' : 'text-white'
                    }`}
                  >
                    Move from idea to operational workflow
                  </h3>
                  <p
                    className={`mx-auto mt-3 max-w-[640px] text-base leading-relaxed ${
                      isLightTheme ? 'text-[#4f607f]' : 'text-[#c2cbe0]'
                    }`}
                  >
                    Launch secure, role-aware internal apps with reporting,
                    approvals, and automation in one place.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className={`mt-6 inline-flex items-center justify-center rounded-full border px-6 py-2.5 text-sm font-semibold transition ${
                      isLightTheme
                        ? 'border-[#c6d6ef] bg-white text-[#1d4ed8] hover:bg-[#eef3ff]'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                    }`}
                  >
                    Get started
                  </button>
                </section>
              </article>

              <aside
                className={`rounded-2xl border p-5 lg:sticky lg:top-20 lg:h-fit ${
                  isLightTheme
                    ? 'border-[#d9e2f2] bg-white'
                    : 'border-white/10 bg-[#111722]'
                }`}
              >
                <p
                  className={`text-2xl font-semibold ${
                    isLightTheme ? 'text-[#111827]' : 'text-white/95'
                  }`}
                >
                  {article.readTime}
                </p>
                <div
                  className={`my-5 border-t ${
                    isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                  }`}
                />

                <p
                  className={`text-[0.82rem] uppercase tracking-[0.18em] ${
                    isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9ca8c1]'
                  }`}
                >
                  In this article
                </p>
                <ul className="mt-3 space-y-2">
                  {(article.contentHtml
                    ? [{ heading: 'Article' }]
                    : article.sections
                  ).map((section) => (
                    <li key={section.heading}>
                      <a
                        href={`#${toAnchorId(section.heading)}`}
                        className={`text-[1.01rem] transition ${
                          isLightTheme
                            ? 'text-[#3e4f6d] hover:text-[#111827]'
                            : 'text-[#c6cede] hover:text-white'
                        }`}
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ul>

                <div
                  className={`my-5 border-t ${
                    isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                  }`}
                />

                <p
                  className={`text-[1.02rem] font-medium ${
                    isLightTheme ? 'text-[#111827]' : ''
                  }`}
                >
                  Share this
                </p>
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
                    aria-label="Share article"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || `/blog/${slug}`}
        isLightTheme={isLightTheme}
        description="Sign in to comment, share, and save articles."
      />
    </div>
  );
}
