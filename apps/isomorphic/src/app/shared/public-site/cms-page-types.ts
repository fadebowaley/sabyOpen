export type PublicCmsImage = {
  fileId?: string | null;
  url?: string | null;
  alt?: string;
  caption?: string;
};

export type PublicCmsContentJson = {
  type?: string;
  content?: PublicCmsContentJson[];
  [key: string]: unknown;
};

export type PublicCmsItem = {
  id?: string;
  slug?: string;
  image?: PublicCmsImage | null;
  order?: number;
  title?: string;
  subtitle?: string;
  body?: string;
  description?: string;
  href?: string;
  badge?: string;
  category?: string;
  tags?: string[];
  author?: string;
  publishedOn?: string;
  readTime?: string;
  lead?: string;
  status?: string;
  target?: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  contentJson?: PublicCmsContentJson | null;
  contentHtml?: string;
  contentText?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PublicCmsSection = {
  id?: string;
  type?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image?: PublicCmsImage | null;
  items?: PublicCmsItem[];
};

export type PublicCmsPage = {
  key?: string;
  title?: string;
  slug?: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  sections?: PublicCmsSection[];
};

export const findCmsSection = (
  cmsPage: PublicCmsPage | null | undefined,
  matcher: string | ((section: PublicCmsSection) => boolean)
) => {
  const sections = cmsPage?.sections || [];
  if (typeof matcher === 'string') {
    return sections.find((section) => section.id === matcher || section.type === matcher);
  }
  return sections.find(matcher);
};

export const cmsText = (value: unknown, fallback: string) => {
  const text = String(value || '').trim();
  return text || fallback;
};

export const cmsSlug = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

export const cmsItemSlug = (item: PublicCmsItem) => {
  const explicitSlug = cmsSlug(item.slug);
  if (explicitSlug) return explicitSlug;

  const href = String(item.href || '').trim();
  const blogMatch = href.match(/\/blog\/([^/?#]+)/);
  if (blogMatch?.[1]) return cmsSlug(decodeURIComponent(blogMatch[1]));

  return cmsSlug(item.id || item.title);
};

export const sanitizeCmsHtml = (value: unknown) => {
  let html = String(value || '').trim();
  if (!html) return '';

  html = html.replace(new RegExp('<script[\\s\\S]*?>[\\s\\S]*?</script>', 'gi'), '');
  html = html.replace(new RegExp('<style[\\s\\S]*?>[\\s\\S]*?</style>', 'gi'), '');
  html = html.replace(new RegExp("\\son\\w+\\s*=\\s*(['\"]).*?\\1", 'gi'), '');
  html = html.replace(new RegExp("\\s(href|src)\\s*=\\s*(['\"])\\s*javascript:[\\s\\S]*?\\2", 'gi'), '');

  return html;
};

export const getCmsImageUrl = (image: PublicCmsImage | null | undefined) => {
  const fileId = String(image?.fileId || '').trim();
  if (fileId) return `/api/public/cms/images/${encodeURIComponent(fileId)}`;
  return String(image?.url || '').trim();
};
