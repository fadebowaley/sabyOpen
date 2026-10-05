'use client';

import { useEffect, useLayoutEffect } from 'react';
import { siteConfig } from '@/config/site.config';
// import hideRechartsConsoleError from '@core/utils/recharts-console-error';
import {
  ThemeProvider as NextThemeProvider,
  useTheme,
} from 'next-themes';
import {
  BERRYLIUM_THEME_COOKIE,
  BERRYLIUM_THEME_STORAGE_KEY,
} from '@/app/shared/theme-keys';

const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

// hideRechartsConsoleError();

export function ThemeProvider({ children }: React.PropsWithChildren<{}>) {
  return (
    <NextThemeProvider
      attribute="data-theme"
      enableSystem={false}
      themes={['light', 'dark']}
      defaultTheme={String(siteConfig.mode)}
      storageKey={BERRYLIUM_THEME_STORAGE_KEY}
    >
      <BerryliumThemeCookieSync />
      {children}
    </NextThemeProvider>
  );
}

function BerryliumThemeCookieSync() {
  const { theme, resolvedTheme } = useTheme();

  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const syncCookie = () => {
      const currentTheme =
        theme === 'light' || theme === 'dark'
          ? theme
          : resolvedTheme === 'light' || resolvedTheme === 'dark'
            ? resolvedTheme
            : window.localStorage.getItem(BERRYLIUM_THEME_STORAGE_KEY);
      if (currentTheme !== 'light' && currentTheme !== 'dark') return;
      document.documentElement.dataset.theme = currentTheme;
      document.documentElement.classList.toggle('dark', currentTheme === 'dark');
      document.cookie = `${BERRYLIUM_THEME_COOKIE}=${currentTheme}; path=/; max-age=31536000; samesite=lax`;
    };

    syncCookie();
    window.addEventListener('storage', syncCookie);
    return () => window.removeEventListener('storage', syncCookie);
  }, [theme, resolvedTheme]);

  return null;
}
