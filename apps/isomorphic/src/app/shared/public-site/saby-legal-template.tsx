'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  href?: string;
};

type SabyLegalTemplateProps = {
  label: string;
  title: string;
  description: string;
  updatedOn: string;
  sections: LegalSection[];
  modalDescription: string;
  callbackPath: string;
  initialTheme?: PublicThemeMode;
};

export default function SabyLegalTemplate({
  label,
  title,
  description,
  updatedOn,
  sections,
  modalDescription,
  callbackPath,
  initialTheme = 'dark',
}: SabyLegalTemplateProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#0c111b] text-white'
      }`}
    >
      <main>
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section className="px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1260px]">
            <div className="max-w-[820px]">
              <p
                className={`text-sm uppercase tracking-[0.2em] ${
                  isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9ba9c7]'
                }`}
              >
                {label}
              </p>
              <h1
                className={`mt-3 text-4xl font-semibold tracking-tight sm:text-5xl ${
                  isLightTheme ? 'text-[#111827]' : 'text-white'
                }`}
              >
                {title}
              </h1>
              <p
                className={`mt-4 text-base leading-relaxed sm:text-lg ${
                  isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                }`}
              >
                {description}
              </p>
              <p
                className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                  isLightTheme
                    ? 'border-[#d4dced] bg-white text-[#2d4c85]'
                    : 'border-white/15 bg-white/5 text-[#cfdaef]'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                Last updated: {updatedOn}
              </p>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <article
                className={`rounded-2xl border p-6 sm:p-8 ${
                  isLightTheme
                    ? 'border-[#d9e2f2] bg-white'
                    : 'border-white/10 bg-[#111722]'
                }`}
              >
                <div className="space-y-10">
                  {sections.map((section, index) => (
                    <section
                      id={section.id}
                      key={section.id}
                      className="scroll-mt-28"
                    >
                      <h2
                        className={`text-2xl font-semibold leading-tight sm:text-3xl ${
                          isLightTheme ? 'text-[#111827]' : 'text-white'
                        }`}
                      >
                        {section.href ? (
                          <Link href={section.href} className="transition hover:opacity-75">
                            {index + 1}. {section.title}
                          </Link>
                        ) : (
                          <>
                            {index + 1}. {section.title}
                          </>
                        )}
                      </h2>
                      <div className="mt-4 space-y-3">
                        {section.paragraphs.map((paragraph) => (
                          <p
                            key={`${section.id}-${paragraph.slice(0, 24)}`}
                            className={`text-[1.01rem] leading-relaxed ${
                              isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                            }`}
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.bullets?.length ? (
                        <ul
                          className={`mt-4 list-disc space-y-2 pl-6 text-[1.01rem] ${
                            isLightTheme ? 'text-[#4f607f]' : 'text-[#c8d0e3]'
                          }`}
                        >
                          {section.bullets.map((item) => (
                            <li key={`${section.id}-${item.slice(0, 24)}`}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                </div>
              </article>

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
                  In this policy
                </p>
                <ul className="mt-3 space-y-2">
                  {sections.map((section) => (
                    <li key={`toc-${section.id}`}>
                      <Link
                        href={section.href || `#${section.id}`}
                        className={`inline-flex items-start gap-1 text-[1.01rem] transition ${
                          isLightTheme
                            ? 'text-[#3e4f6d] hover:text-[#111827]'
                            : 'text-[#c6cede] hover:text-white'
                        }`}
                      >
                        <ChevronRight className="mt-[2px] h-4 w-4 shrink-0" />
                        <span>{section.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div
                  className={`my-5 border-t ${
                    isLightTheme ? 'border-[#d9e2f2]' : 'border-white/10'
                  }`}
                />
                <p
                  className={`text-sm ${
                    isLightTheme ? 'text-[#5c6d8a]' : 'text-[#b8bfd2]'
                  }`}
                >
                  Need a legal question answered by our team?
                </p>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`mt-3 inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isLightTheme
                      ? 'border-[#c6d6ef] bg-white text-[#1d4ed8] hover:bg-[#eef3ff]'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  Contact support
                </button>
                <Link
                  href={
                    callbackPath === '/terms-of-service'
                      ? '/privacy-policy'
                      : '/terms-of-service'
                  }
                  className={`mt-2 inline-flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isLightTheme
                      ? 'border-[#d9e2f2] text-[#1f2f50] hover:bg-[#f3f7ff]'
                      : 'border-white/15 text-[#d7deef] hover:bg-white/10'
                  }`}
                >
                  {callbackPath === '/terms-of-service'
                    ? 'Read privacy policy'
                    : 'Read terms of service'}
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || callbackPath}
        isLightTheme={isLightTheme}
        description={modalDescription}
      />
    </div>
  );
}
