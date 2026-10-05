import type { Metadata } from 'next';
import SabyBlogPage from '@/app/shared/public-site/saby-blog-page';
import { getPublishedCmsPage } from '@/app/shared/public-site/cms-page.server';
import { getInitialPublicTheme } from '@/app/shared/public-site/public-theme.server';
import { metaObject } from '@/config/site.config';

export const metadata: Metadata = {
  ...metaObject('Blog'),
};

export default async function BlogPage() {
  const [initialTheme, cmsPage] = await Promise.all([
    getInitialPublicTheme('dark'),
    getPublishedCmsPage('blog'),
  ]);
  return <SabyBlogPage initialTheme={initialTheme} cmsPage={cmsPage} />;
}
