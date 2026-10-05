'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type SetStateAction,
} from 'react';

export type PublicThemeMode = 'dark' | 'light';

export const PUBLIC_THEME_STORAGE_KEY = 'saby:theme-preference:public-pages';
export const PUBLIC_THEME_COOKIE = 'saby-public-theme';
const LEGACY_PUBLIC_THEME_STORAGE_KEYS = ['saby:theme-preference'];

type UsePublicThemeOptions = {
  storageKey?: string;
};

const useBrowserLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

const isPublicThemeMode = (value: unknown): value is PublicThemeMode =>
  value === 'light' || value === 'dark';

const readCookieTheme = () => {
  if (typeof document === 'undefined') return null;
  const cookieTheme = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PUBLIC_THEME_COOKIE}=`))
    ?.split('=')[1];
  return isPublicThemeMode(cookieTheme) ? cookieTheme : null;
};

const persistPublicTheme = (themeMode: PublicThemeMode, storageKey: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, themeMode);
  LEGACY_PUBLIC_THEME_STORAGE_KEYS.forEach((legacyKey) => {
    window.localStorage.setItem(legacyKey, themeMode);
  });
  document.cookie = `${PUBLIC_THEME_COOKIE}=${themeMode}; path=/; max-age=31536000; samesite=lax`;
};

export function applyPublicThemeDom(themeMode: PublicThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = themeMode;
  document.documentElement.classList.toggle('dark', themeMode === 'dark');
  document.documentElement.style.colorScheme = themeMode;
}

export function usePublicTheme(
  defaultTheme: PublicThemeMode = 'dark',
  options?: UsePublicThemeOptions
) {
  const storageKey = options?.storageKey ?? PUBLIC_THEME_STORAGE_KEY;
  const [themeMode, setThemeMode] = useState<PublicThemeMode>(defaultTheme);
  const [hasHydratedTheme, setHasHydratedTheme] = useState(false);

  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const cookieTheme = readCookieTheme();
    if (cookieTheme) {
      applyPublicThemeDom(cookieTheme);
      window.localStorage.setItem(storageKey, cookieTheme);
      LEGACY_PUBLIC_THEME_STORAGE_KEYS.forEach((legacyKey) => {
        window.localStorage.setItem(legacyKey, cookieTheme);
      });
      setThemeMode(cookieTheme);
      setHasHydratedTheme(true);
      return;
    }

    const storedTheme = window.localStorage.getItem(storageKey);
    if (isPublicThemeMode(storedTheme)) {
      applyPublicThemeDom(storedTheme);
      persistPublicTheme(storedTheme, storageKey);
      setThemeMode(storedTheme);
      setHasHydratedTheme(true);
      return;
    }

    const legacyTheme = LEGACY_PUBLIC_THEME_STORAGE_KEYS.map((legacyKey) =>
      window.localStorage.getItem(legacyKey)
    ).find((value) => value === 'light' || value === 'dark');

    if (isPublicThemeMode(legacyTheme)) {
      applyPublicThemeDom(legacyTheme);
      persistPublicTheme(legacyTheme, storageKey);
      setThemeMode(legacyTheme);
      setHasHydratedTheme(true);
      return;
    }

    applyPublicThemeDom(defaultTheme);
    persistPublicTheme(defaultTheme, storageKey);
    setThemeMode(defaultTheme);
    setHasHydratedTheme(true);
  }, [defaultTheme, storageKey]);

  useBrowserLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasHydratedTheme) return;
    applyPublicThemeDom(themeMode);
    persistPublicTheme(themeMode, storageKey);
  }, [hasHydratedTheme, storageKey, themeMode]);

  const isLightTheme = useMemo(() => themeMode === 'light', [themeMode]);

  const updateThemeMode = useCallback(
    (value: SetStateAction<PublicThemeMode>) => {
      setThemeMode((previous) => {
        const next = typeof value === 'function' ? value(previous) : value;
        applyPublicThemeDom(next);
        persistPublicTheme(next, storageKey);
        return next;
      });
    },
    [storageKey]
  );

  const toggleTheme = () => {
    setThemeMode((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark';
      applyPublicThemeDom(next);
      persistPublicTheme(next, storageKey);
      return next;
    });
  };

  return {
    themeMode,
    isLightTheme,
    setThemeMode: updateThemeMode,
    toggleTheme,
  };
}
