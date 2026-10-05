import Link from 'next/link';
import { publicSiteTheme } from './public-theme-classes';

type SabyPricingCtaSectionProps = {
  isLightTheme: boolean;
  onCtaClick?: () => void;
};

export default function SabyPricingCtaSection({
  isLightTheme,
  onCtaClick,
}: SabyPricingCtaSectionProps) {
  const ctaClassName =
    'inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#5f3df4_0%,#7f44f7_100%)] px-8 text-[1rem] font-semibold text-white transition hover:brightness-110';

  return (
    <section
      className={`relative px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8 ${
        isLightTheme ? publicSiteTheme.light.pageBg : 'bg-transparent'
      }`}
    >
      <div className="relative mx-auto max-w-[1100px] text-center">
        <h2
          className={`mt-2 text-[2.1rem] font-semibold tracking-tight sm:text-[3rem] ${
            isLightTheme ? 'text-[#111827]' : 'text-white'
          }`}
        >
          Scale operations without losing control.
        </h2>
        <p
          className={`mt-4 text-base sm:text-lg ${
            isLightTheme ? 'text-[#546280]' : 'text-[#b7becf]'
          }`}
        >
          Start with Starter for $9/mo. Upgrade when you need more.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {onCtaClick ? (
            <button type="button" onClick={onCtaClick} className={ctaClassName}>
              Get started — $9/mo
            </button>
          ) : (
            <Link href="/checkout" className={ctaClassName}>
              Get started — $9/mo
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
