import {
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';
import { cookies } from 'next/headers';

const PUBLIC_THEME_COOKIE = 'saby-public-theme';

const isPublicThemeMode = (value: unknown): value is PublicThemeMode =>
  value === 'light' || value === 'dark';

export async function getInitialPublicTheme(
  fallback: PublicThemeMode = 'dark'
): Promise<PublicThemeMode> {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(PUBLIC_THEME_COOKIE)?.value;
  if (isPublicThemeMode(cookieTheme)) return cookieTheme;
  return fallback;
}
