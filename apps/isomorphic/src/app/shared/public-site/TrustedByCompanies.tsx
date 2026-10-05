'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

type TrustedByCompaniesProps = {
  isLightTheme: boolean;
};

type Company = {
  name: string;
  logo: string;
};

const companies: Company[] = [
  { name: 'Google', logo: '/logos/google.svg' },
  { name: 'Microsoft', logo: '/logos/microsoft.svg' },
  { name: 'Amazon', logo: '/logos/amazon.svg' },
  { name: 'Meta', logo: '/logos/meta.svg' },
  { name: 'Stripe', logo: '/logos/stripe.svg' },
  { name: 'Slack', logo: '/logos/slack.svg' },
  { name: 'Notion', logo: '/logos/notion.svg' },
  { name: 'Flutterwave', logo: '/logos/flutterwave.svg' },
  { name: 'Paystack', logo: '/logos/paystack.svg' },
];

const scrollingCompanies = [...companies, ...companies];

export default function TrustedByCompanies({
  isLightTheme,
}: TrustedByCompaniesProps) {
  return (
    <section className="relative overflow-hidden bg-[#000000] px-4 py-24 sm:px-6 lg:px-8">
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.2),rgba(0,0,0,0)_48%)] ${
          isLightTheme ? 'opacity-90' : ''
        }`}
      />

      <div className="relative mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-auto max-w-[820px] text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for organizations that cannot afford operational blind spots
          </h2>
          <p className="mx-auto mt-4 max-w-[680px] text-base leading-relaxed text-[#b8bfd2] sm:text-lg">
            Pilots across 200+ branches use Saby to centralize compliance,
            reporting, and executive oversight.
          </p>
        </motion.div>

        <div className="trusted-viewport relative mx-auto mt-12 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[11%] bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-[11%] bg-gradient-to-l from-black to-transparent" />

          <div className="trusted-mask relative overflow-hidden">
            <div className="trusted-by-track flex w-max items-center gap-[var(--logo-gap)] py-3">
              {scrollingCompanies.map((company, index) => (
                <div
                  key={`${company.name}-${index}`}
                  className="trusted-logo-item group flex items-center justify-center rounded-2xl border border-white/20 bg-white px-5 py-4 transition hover:border-white/35"
                >
                  <Image
                    src={company.logo}
                    alt={`${company.name} logo`}
                    width={320}
                    height={80}
                    className="trusted-logo h-[var(--logo-height)] w-auto max-w-[84%] object-contain opacity-90 transition duration-300 group-hover:scale-[1.05] group-hover:opacity-100"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes trusted-by-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }

        .trusted-viewport {
          --logo-gap: 1rem;
          --logo-card-width: clamp(4.4rem, 18vw, 14rem);
          --logo-height: clamp(1.25rem, 2.8vw, 2.4rem);
          width: min(
            100%,
            calc((var(--logo-card-width) * 4) + (var(--logo-gap) * 3))
          );
        }

        .trusted-mask {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .trusted-logo-item {
          width: var(--logo-card-width);
          min-width: var(--logo-card-width);
          height: clamp(3.6rem, 9vw, 5.3rem);
        }

        .trusted-by-track {
          animation: trusted-by-scroll 34s linear infinite;
          will-change: transform;
        }

        .trusted-by-track:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .trusted-by-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
