import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type SabyMeetSectionProps = {
  isLightTheme: boolean;
};

const partnerBrands = ['Uber', 'Microsoft', 'ElevenLabs', 'HubSpot', 'HCA Healthcare'];

const capabilityRows = [
  {
    title: 'Start with an idea',
    description: 'Describe the app or website you want to create, or drop in screenshots and docs.',
  },
  {
    title: 'Watch it come to life',
    description: 'See your vision transform into a working prototype in real time as AI builds with you.',
  },
  {
    title: 'Refine and ship',
    description: 'Iterate with simple feedback and deploy confidently with one click.',
  },
];

export default function SabyMeetSection({ isLightTheme }: SabyMeetSectionProps) {
  return (
    <section className={`relative px-4 pb-20 sm:px-6 lg:px-8 ${isLightTheme ? 'bg-[#f5f5f3]' : 'bg-[#0b0f16]'}`}>
      <div className="relative mx-auto max-w-[1180px]">
        <div className="pt-4 text-center">
          <p className={`text-sm ${isLightTheme ? 'text-[#5f6f8d]' : 'text-[#aab2c6]'}`}>
            Teams from top companies build with Saby
          </p>
          <div className="mt-6 grid grid-cols-2 gap-5 text-lg font-semibold sm:grid-cols-3 lg:grid-cols-5">
            {partnerBrands.map((brand) => (
              <span key={brand} className={`${isLightTheme ? 'text-[#26334e]' : 'text-white/90'}`}>
                {brand}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className={`text-4xl font-bold tracking-tight sm:text-5xl ${isLightTheme ? 'text-[#121b2d]' : 'text-white'}`}>
            Meet Saby
          </h2>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
            <div
              className={`relative overflow-hidden rounded-3xl border p-6 sm:p-10 ${
                isLightTheme ? 'border-[#d9e1f0] bg-white' : 'border-white/10 bg-[#1a1d24]'
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.24),rgba(0,0,0,0)_44%)]" />
              <div className="relative mx-auto max-w-[540px] rounded-[26px] border border-white/15 bg-[#d8d9dc]/90 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d6b98f]" />
                  <div className="h-2.5 w-20 rounded-full bg-[#ceb28c]" />
                  <div className="h-2.5 w-14 rounded-full bg-[#ceb28c]" />
                </div>
                <div className="h-28 rounded-2xl bg-[linear-gradient(135deg,#6ea4ff_0%,#8e6bff_45%,#ef5a9d_100%)]" />
                <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
                  <div className="space-y-2">
                    <div className="h-4 w-10 rounded-full bg-[#cab086]" />
                    <div className="h-8 rounded-lg bg-white/55" />
                    <div className="h-8 rounded-lg bg-white/50" />
                    <div className="h-8 rounded-lg bg-white/45" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="h-10 w-10 rounded-lg bg-[#d38f2e]" />
                    <span className="h-10 w-10 rounded-lg bg-[#cf5b43]" />
                    <span className="h-10 w-10 rounded-lg bg-[#2d8f45]" />
                    <span className="h-10 w-10 rounded-lg bg-[#111319]" />
                  </div>
                </div>
                <div className="mt-5 flex justify-center">
                  <Link
                    href="/coming-soon"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2f73ff] px-6 py-3 text-2xl font-semibold text-white shadow-[0_10px_30px_rgba(47,115,255,0.5)]"
                  >
                    Publish
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className={`rounded-3xl border p-6 sm:p-8 ${
                isLightTheme ? 'border-[#d9e1f0] bg-white/90' : 'border-white/10 bg-[#11141b]/90'
              }`}
            >
              <div className="space-y-6">
                {capabilityRows.map((item, index) => (
                  <article
                    key={item.title}
                    className={`rounded-2xl border p-5 ${
                      index === capabilityRows.length - 1
                        ? isLightTheme
                          ? 'border-[#c7d4eb] bg-[#eef4ff]'
                          : 'border-[#2e3d5c] bg-[#1a2232]'
                        : isLightTheme
                          ? 'border-[#e2e8f5] bg-[#f9fbff]'
                          : 'border-white/10 bg-[#171b23]'
                    }`}
                  >
                    <h3 className={`text-3xl font-semibold ${isLightTheme ? 'text-[#1b2740]' : 'text-white'}`}>{item.title}</h3>
                    <p className={`mt-2 text-xl leading-relaxed ${isLightTheme ? 'text-[#4f607f]' : 'text-[#b8c1d6]'}`}>
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
