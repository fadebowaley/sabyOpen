import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  cmsText,
} from '@/app/shared/public-site/cms-page-types';
import { findCmsEntryBySlug } from '@/app/shared/public-site/cms-entry-utils';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import SabyBlogArticlePage from '@/app/shared/public-site/saby-blog-article-page';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cmsPage = await getPublishedCmsPage('blog');
  const cmsArticle = findCmsEntryBySlug(cmsPage, 'blog', slug);
  const pageTitle = slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const title = cmsText(cmsArticle?.seoTitle || cmsArticle?.title, pageTitle || 'Blog Article');
  const description = cmsText(
    cmsArticle?.seoDescription ||
      cmsArticle?.summary ||
      cmsArticle?.description ||
      cmsArticle?.body ||
      cmsArticle?.contentText,
    'Read the latest Saby article.'
  );

  return metaObject(
    title,
    cmsArticle?.image?.url
      ? {
          title: `${title} - Saby`,
          description,
          url: `https://saby.ai/blog/${slug}`,
          siteName: 'Saby',
          images: {
            url: cmsArticle.image.url,
            width: 1200,
            height: 630,
          },
          locale: 'en_US',
          type: 'article',
        }
      : undefined,
    description
  );
}

export default async function BlogArticlePage({
  params,
}: BlogArticlePageProps) {
  const { slug } = await params;
  const initialTheme = await getInitialPublicTheme('dark');
  const cmsPage = await getPublishedCmsPage('blog');
  const cmsArticle = findCmsEntryBySlug(cmsPage, 'blog', slug);

  if (!cmsArticle) {
    notFound();
  }

  return (
    <SabyBlogArticlePage
      slug={slug}
      initialTheme={initialTheme}
      cmsPage={cmsPage}
    />
  );
}
