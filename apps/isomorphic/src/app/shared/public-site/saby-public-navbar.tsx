'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { routes } from '@/config/routes';
import PublicThemeToggleButton from './public-theme-toggle-button';

type SabyPublicNavbarProps = {
  isLightTheme?: boolean;
  onOpenAuthModal: () => void;
  onToggleTheme?: () => void;
};

type PublicNavItem = {
  label: string;
  href?: string;
};

type PublicLinkItem = {
  label: string;
  href: string;
};

const solutionItems = [
  { label: 'Faith Networks' },
  { label: 'NGOs and Nonprofits' },
  { label: 'Education Groups' },
  { label: 'Retail and Field Networks' },
  { label: 'Energy' },
  { label: 'Commerce' },
  { label: 'Health care' },
];

const resourceItems: PublicLinkItem[] = [
  { label: 'Documentation', href: '/documentation' },
  { label: 'Case Studies', href: '/blog' },
  { label: 'Partners', href: '/partners' },
];

const primaryNavItems: PublicNavItem[] = [
  { label: 'Platform', href: '/#' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources' },
];

const isPathActive = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function SabyPublicNavbar({
  isLightTheme = false,
  onOpenAuthModal,
  onToggleTheme,
}: SabyPublicNavbarProps) {
  const logoSrc = isLightTheme ? '/saby-logo.png' : '/logo-short-light.png';
  const pathname = usePathname() || '/';
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isSessionLoading = status === 'loading';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSolutionsMenuOpen, setIsSolutionsMenuOpen] = useState(false);
  const [isResourcesMenuOpen, setIsResourcesMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);
  const resourcesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsMobileMenuOpen(false);
      }
      if (
        solutionsMenuRef.current &&
        !solutionsMenuRef.current.contains(target)
      ) {
        setIsSolutionsMenuOpen(false);
      }
      if (
        resourcesMenuRef.current &&
        !resourcesMenuRef.current.contains(target)
      ) {
        setIsResourcesMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSolutionsMenuOpen(false);
    setIsResourcesMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsMobileMenuOpen(false);
      setIsSolutionsMenuOpen(false);
      setIsResourcesMenuOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/" className="inline-flex items-center">
          <Image
            src={logoSrc}
            alt="Saby mark"
            width={48}
            height={48}
            className={
              isLightTheme
                ? 'h-20 w-20 sm:h-24 sm:w-24'
                : 'h-7 w-7 sm:h-8 sm:w-8'
            }
          />
        </Link>

        <nav className="hidden items-center gap-4 md:flex lg:gap-5">
          <div className="relative" ref={solutionsMenuRef}>
            <button
              type="button"
              onClick={() => setIsSolutionsMenuOpen((previous) => !previous)}
              className={`inline-flex items-center gap-1 text-sm font-medium transition active:scale-[0.98] ${
                isLightTheme
                  ? 'text-[#23314f] hover:text-[#111827]'
                  : 'text-[#d5dae8] hover:text-white'
              }`}
            >
              Solutions
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isSolutionsMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isSolutionsMenuOpen && (
              <div
                className={`menu-pop absolute left-0 top-9 z-30 w-56 rounded-lg border p-1.5 shadow-xl ${
                  isLightTheme
                    ? 'border-[#d4dced] bg-white'
                    : 'border-white/10 bg-[#2f3139]'
                }`}
              >
                {solutionItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[13px] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-[#e8e8ee] hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={resourcesMenuRef}>
            <button
              type="button"
              onClick={() => setIsResourcesMenuOpen((previous) => !previous)}
              className={`inline-flex items-center gap-1 text-sm font-medium transition active:scale-[0.98] ${
                isLightTheme
                  ? 'text-[#23314f] hover:text-[#111827]'
                  : 'text-[#d5dae8] hover:text-white'
              }`}
            >
              Resources
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isResourcesMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isResourcesMenuOpen && (
              <div
                className={`menu-pop absolute left-0 top-9 z-30 w-48 rounded-lg border p-1.5 shadow-xl ${
                  isLightTheme
                    ? 'border-[#d4dced] bg-white'
                    : 'border-white/10 bg-[#2f3139]'
                }`}
              >
                {resourceItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block rounded-md px-2.5 py-1.5 text-[13px] transition ${
                      isPathActive(pathname, item.href)
                        ? isLightTheme
                          ? 'bg-[#eef3ff] text-[#111827]'
                          : 'bg-white/10 text-white'
                        : isLightTheme
                          ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                          : 'text-[#e8e8ee] hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {primaryNavItems.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-medium transition ${
                  isPathActive(pathname, item.href)
                    ? isLightTheme
                      ? 'text-[#111827]'
                      : 'text-white'
                    : isLightTheme
                      ? 'text-[#23314f] hover:text-[#111827]'
                      : 'text-[#d5dae8] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className={`cursor-default text-sm font-medium ${
                  isLightTheme ? 'text-[#23314f]' : 'text-[#d5dae8]'
                }`}
              >
                {item.label}
              </span>
            )
          )}
        </nav>
      </div>

      <div className="relative flex items-center gap-1.5 sm:gap-2">
        {onToggleTheme ? (
          <PublicThemeToggleButton
            mode={isLightTheme ? 'light' : 'dark'}
            onChange={onToggleTheme}
          />
        ) : null}

        {!isSessionLoading && !isAuthenticated && (
          <>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm md:inline-flex ${
                isLightTheme
                  ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                  : 'bg-white text-[#16171c] hover:bg-[#e7e8ef]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`hidden rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm md:inline-flex ${
                isLightTheme
                  ? 'border-[#ced7e8] bg-white text-[#16171c] hover:bg-[#eef3ff]'
                  : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <span className="sm:hidden">Request demo</span>
              <span className="hidden sm:inline">Request demo</span>
            </button>
          </>
        )}
        {!isSessionLoading && isAuthenticated && (
          <>
            <Link
              href={routes.studioV2.index}
              className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm md:inline-flex ${
                isLightTheme
                  ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                  : 'bg-white text-[#16171c] hover:bg-[#e7e8ef]'
              }`}
            >
              Open Workspace
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className={`hidden rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm md:inline-flex ${
                isLightTheme
                  ? 'border-[#ced7e8] bg-white text-[#16171c] hover:bg-[#eef3ff]'
                  : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              Logout
            </button>
          </>
        )}

        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((previous) => !previous)}
            className={`rounded-full border p-1.5 transition active:scale-[0.98] sm:p-2 ${
              isLightTheme
                ? 'border-[#ced7e8] bg-white text-[#23314f] hover:bg-[#eef3ff]'
                : 'border-white/25 bg-white/5 text-[#e6e8f0] hover:bg-white/10'
            }`}
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {isMobileMenuOpen && (
            <div
              className={`menu-pop absolute right-0 top-12 z-30 w-[220px] rounded-xl border p-2.5 shadow-2xl ${
                isLightTheme
                  ? 'border-[#d4dced] bg-white'
                  : 'border-white/10 bg-[#30333b]'
              }`}
            >
              <p
                className={`px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isLightTheme ? 'text-[#677792]' : 'text-[#aeb3c4]'
                }`}
              >
                Solutions
              </p>
              <div className="space-y-1">
                {solutionItems.map((item) => (
                  <button
                    key={`mobile-solution-${item.label}`}
                    type="button"
                    className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-[#e8e8ee] hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div
                className={`my-2 border-t ${
                  isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'
                }`}
              />
              <p
                className={`px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isLightTheme ? 'text-[#677792]' : 'text-[#aeb3c4]'
                }`}
              >
                Resources
              </p>
              <div className="space-y-1">
                {resourceItems.map((item) => (
                  <Link
                    key={`mobile-resource-${item.label}`}
                    href={item.href}
                    className={`block rounded-lg px-2.5 py-1.5 text-[13px] transition ${
                      isLightTheme
                        ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                        : 'text-[#e8e8ee] hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div
                className={`my-2 border-t ${
                  isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'
                }`}
              />
              <div className="space-y-1">
                {primaryNavItems.map((item) =>
                  item.href ? (
                    <Link
                      key={`mobile-primary-${item.label}`}
                      href={item.href}
                      className={`block rounded-lg px-2.5 py-1.5 text-[13px] transition ${
                        isLightTheme
                          ? 'text-[#1f2a44] hover:bg-[#eef3ff]'
                          : 'text-[#e8e8ee] hover:bg-white/10'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      key={`mobile-primary-${item.label}`}
                      className={`block rounded-lg px-2.5 py-1.5 text-[13px] ${
                        isLightTheme ? 'text-[#1f2a44]' : 'text-[#e8e8ee]'
                      }`}
                    >
                      {item.label}
                    </span>
                  )
                )}
              </div>

              <div
                className={`my-2 border-t ${
                  isLightTheme ? 'border-[#dbe2f0]' : 'border-white/15'
                }`}
              />
              {!isSessionLoading && !isAuthenticated && (
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm ${
                      isLightTheme
                        ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                        : 'bg-white text-[#16171c] hover:bg-[#e7e8ef]'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAuthModal}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm ${
                      isLightTheme
                        ? 'border-[#ced7e8] bg-white text-[#16171c] hover:bg-[#eef3ff]'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Request demo
                  </button>
                </div>
              )}
              {!isSessionLoading && isAuthenticated && (
                <div className="grid gap-2">
                  <Link
                    href={routes.studioV2.index}
                    className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm ${
                      isLightTheme
                        ? 'bg-[#111827] text-white hover:bg-[#1f2937]'
                        : 'bg-white text-[#16171c] hover:bg-[#e7e8ef]'
                    }`}
                  >
                    Open Workspace
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`rounded-full border px-3 py-1.5 text-center text-xs font-semibold transition active:scale-[0.98] sm:px-4 sm:py-2 sm:text-sm ${
                      isLightTheme
                        ? 'border-[#ced7e8] bg-white text-[#16171c] hover:bg-[#eef3ff]'
                        : 'border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
