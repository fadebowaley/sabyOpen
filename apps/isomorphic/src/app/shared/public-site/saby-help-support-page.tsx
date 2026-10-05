'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpenText, LifeBuoy, Mail, Phone, ShieldCheck, Ticket } from 'lucide-react';
import FooterSection from '@/app/shared/public-site/footer-section';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import SabyFaqSection from '@/app/shared/public-site/saby-faq-section';
import SabyPublicNavbar from '@/app/shared/public-site/saby-public-navbar';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';

const supportChannels = [
  {
    id: 'email',
    title: 'Email support',
    description: 'Business and technical questions with tracked responses.',
    value: 'hello@saby.ai',
    href: 'mailto:hello@saby.ai',
    icon: Mail,
  },
  {
    id: 'phone',
    title: 'Phone support',
    description: 'Direct line for urgent platform and account issues.',
    value: '0810 777 1205',
    href: 'tel:08107771205',
    icon: Phone,
  },
  {
    id: 'docs',
    title: 'Documentation',
    description: 'API, module, and platform usage guides.',
    value: 'Open docs',
    href: '/documentation',
    icon: BookOpenText,
  },
  {
    id: 'ticket',
    title: 'Support ticket',
    description: 'Open an issue and track progress across your team.',
    value: 'Create ticket',
    href: 'mailto:hello@saby.ai?subject=Saby%20Support%20Ticket',
    icon: Ticket,
  },
];

type SabyHelpSupportPageProps = {
  initialTheme?: PublicThemeMode;
};

export default function SabyHelpSupportPage({
  initialTheme = 'dark',
}: SabyHelpSupportPageProps) {
  const pathname = usePathname();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#121722] text-[#edf2ff]'
      }`}
    >
      <main>
        <SabyPublicNavbar
          isLightTheme={isLightTheme}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <section className="px-4 pb-10 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[860px]">
              <p
                className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                  isLightTheme ? 'text-[#5f6f8d]' : 'text-[#9db0d1]'
                }`}
              >
                Help and Support
              </p>
              <h1
                className={`mt-4 text-4xl font-semibold tracking-tight sm:text-5xl ${
                  isLightTheme ? 'text-[#111827]' : 'text-[#f5f8ff]'
                }`}
              >
                Enterprise support, answers, and documentation
              </h1>
              <p
                className={`mt-4 max-w-[760px] text-base leading-relaxed sm:text-lg ${
                  isLightTheme ? 'text-[#4f607f]' : 'text-[#bdc7dc]'
                }`}
              >
                Get direct help for onboarding, settings, access, and module operations.
                This page combines quick support channels with the full Saby FAQ library.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {supportChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <a
                    key={channel.id}
                    href={channel.href}
                    className={`rounded-2xl border p-5 transition ${
                      isLightTheme
                        ? 'border-[#d6dfef] bg-white hover:border-[#bfcce4]'
                        : 'border-white/10 bg-[#141b27] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`text-lg font-semibold ${
                            isLightTheme ? 'text-[#111827]' : 'text-[#f3f6ff]'
                          }`}
                        >
                          {channel.title}
                        </p>
                        <p
                          className={`mt-2 text-sm leading-relaxed ${
                            isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                          }`}
                        >
                          {channel.description}
                        </p>
                        <p
                          className={`mt-4 text-sm font-semibold ${
                            isLightTheme ? 'text-[#1e4294]' : 'text-[#d7e3ff]'
                          }`}
                        >
                          {channel.value}
                        </p>
                      </div>
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                          isLightTheme
                            ? 'border-[#d6dfef] bg-[#f7f9ff] text-[#2a4fa2]'
                            : 'border-white/15 bg-[#1a2434] text-[#d7e3ff]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>

            <div
              className={`mt-5 rounded-2xl border px-5 py-4 ${
                isLightTheme
                  ? 'border-[#d6dfef] bg-white'
                  : 'border-white/10 bg-[#141b27]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className={`mt-0.5 h-5 w-5 ${
                      isLightTheme ? 'text-[#2a4fa2]' : 'text-[#d7e3ff]'
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isLightTheme ? 'text-[#111827]' : 'text-[#f0f4ff]'
                      }`}
                    >
                      Support SLA
                    </p>
                    <p
                      className={`text-sm ${
                        isLightTheme ? 'text-[#5f7090]' : 'text-[#b4bfd5]'
                      }`}
                    >
                      Standard response within 24 hours for business support channels.
                    </p>
                  </div>
                </div>
                <Link
                  href="/product-updates"
                  className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isLightTheme
                      ? 'border-[#c7d4ec] bg-white text-[#1e4294] hover:bg-[#eef3ff]'
                      : 'border-white/20 bg-white/5 text-[#d7e3ff] hover:bg-white/10'
                  }`}
                >
                  View product updates
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SabyFaqSection isLightTheme={isLightTheme} />

        <FooterSection variant="landing" isLightTheme={isLightTheme} />
      </main>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={pathname || '/help'}
        isLightTheme={isLightTheme}
        description="Sign in to continue with support, account, and workspace assistance."
      />
    </div>
  );
}
