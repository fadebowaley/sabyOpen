'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import { getCmsEntries } from '@/app/shared/public-site/cms-entry-utils';
import {
  cmsItemSlug,
  cmsText,
  findCmsSection,
  getCmsImageUrl,
  type PublicCmsPage,
} from '@/app/shared/public-site/cms-page-types';
import { sabyBlogArticles } from '@/app/shared/public-site/saby-blog-content';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

const blogCategories = [
  'Announcements',
  'Inside Saby',
  'Development 101',
  'Reports',
  'Tutorials',
  'Stories',
];

type SabyBlogPageProps = {
  initialTheme?: PublicThemeMode;
  cmsPage?: PublicCmsPage | null;
};

export default function SabyBlogPage({
  initialTheme = 'dark',
  cmsPage = null,
}: SabyBlogPageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const heroSection = findCmsSection(cmsPage, 'hero');
  const categoriesSection = findCmsSection(cmsPage, 'categories');
  const cmsEntries = getCmsEntries(cmsPage, 'blog');
  const articlesSection = findCmsSection(cmsPage, 'articles');
  const renderedCategories = categoriesSection?.items?.length
    ? categoriesSection.items
        .map((item) => cmsText(item.title, ''))
        .filter(Boolean)
    : blogCategories;
  const renderedArticles = cmsEntries.length
    ? cmsEntries.map((item, index) => ({
        id: item.id || `cms-article-${index + 1}`,
        slug: item.slug,
        category: cmsText(item.category, 'Announcements'),
        title: item.title,
        summary: item.summary,
        author: cmsText(item.author, 'Saby Product'),
        publishedOn: cmsText(item.publishedOn, ''),
        image: item.image || null,
        href: item.href,
      }))
    : articlesSection?.items?.length
    ? articlesSection.items
        .filter((item) => item.title)
        .map((item, index) => ({
          id: item.id || `cms-article-${index + 1}`,
          slug: cmsItemSlug(item),
          category: cmsText(item.category, 'Announcements'),
          title: cmsText(item.title, 'Saby update'),
          summary: cmsText(item.summary || item.description || item.body, ''),
          author: cmsText(item.author, 'Saby Product'),
          publishedOn: cmsText(item.publishedOn, ''),
          image: item.image || null,
          href: cmsText(item.href, `/blog/${cmsItemSlug(item) || `cms-article-${index + 1}`}`),
        }))
    : sabyBlogArticles.map((article) => ({
        ...article,
        id: article.slug,
        href: `/blog/${article.slug}`,
      }));
  const heroLabel = cmsText(heroSection?.subtitle, 'Blog');
  const heroTitle = cmsText(heroSection?.title, 'Insights from the Saby team');
  const heroBody = cmsText(heroSection?.body, 'Compiled notes from the Saby team.');

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
            <div className="max-w-[760px]">
              <p
                className={`text-sm uppercase tracking-[0.2em] ${
                  isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9ba9c7]'
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
                className={`mt-4 text-base leading-relaxed sm:text-lg ${
                  isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                }`}
              >
                {heroBody}
              </p>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
              <aside
                className={`rounded-2xl border p-5 lg:sticky lg:top-20 lg:h-fit ${
                  isLightTheme
                    ? 'border-[#d9e2f2] bg-white'
                    : 'border-white/10 bg-[#111722]'
                }`}
              >
                <h2 className="text-3xl font-semibold tracking-tight">
                  Latest
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {renderedCategories.map((category) => (
                    <li key={category}>
                      <Link
                        href="/blog"
                        className={`text-[1.02rem] transition ${
                          isLightTheme
                            ? 'text-[#3e4f6d] hover:text-[#111827]'
                            : 'text-[#c6cede] hover:text-white'
                        }`}
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="grid gap-10 pt-2 md:grid-cols-2 lg:pt-8">
                {renderedArticles.map((article, index) => (
                  <article key={article.id} className="group">
                    <Link
                      href={article.href}
                      className={`block overflow-hidden rounded-xl border ${
                        isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                      }`}
                    >
                      {getCmsImageUrl(article.image) ? (
                        <img
                          src={getCmsImageUrl(article.image)}
                          alt={article.image?.alt || article.title}
                          className="h-[265px] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`h-[265px] transition duration-300 group-hover:scale-[1.02] ${
                            index % 2 === 0
                              ? isLightTheme
                                ? 'bg-[#ece8df]'
                                : 'bg-[#1a202a]'
                              : isLightTheme
                                ? 'bg-[#e6e2d9]'
                                : 'bg-[#202735]'
                          }`}
                        />
                      )}
                    </Link>

                    <p
                      className={`mt-4 text-sm lowercase tracking-wide ${
                        isLightTheme ? 'text-[#5f6f8d]' : 'text-[#b6bed2]'
                      }`}
                    >
                      {article.category}
                    </p>
                    <Link
                      href={article.href}
                      className={`mt-2 block text-[2rem] font-semibold leading-tight tracking-tight transition ${
                        isLightTheme
                          ? 'text-[#0f172a] hover:text-[#1d4ed8]'
                          : 'text-white hover:text-[#d8dff2]'
                      }`}
                    >
                      {article.title}
                    </Link>
                    <p
                      className={`mt-3 text-[1.02rem] leading-relaxed ${
                        isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                      }`}
                    >
                      {article.summary}
                    </p>
                    <p
                      className={`mt-3 text-base ${
                        isLightTheme ? 'text-[#60718f]' : 'text-[#c5ccdd]'
                      }`}
                    >
                      {article.author}{article.publishedOn ? ` • ${article.publishedOn}` : ''}
                    </p>
                    <Link
                      href={article.href}
                      className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition ${
                        isLightTheme
                          ? 'text-[#1d4ed8] hover:text-[#1e40af]'
                          : 'text-white hover:text-[#d5ddf5]'
                      }`}
                    >
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/blog'}
        isLightTheme={isLightTheme}
        description="Sign in to save posts and continue reading in your workspace."
      />
    </div>
  );
}
