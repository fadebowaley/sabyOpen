'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, CircleHelp } from 'lucide-react';
import {
  buildCheckoutPath,
  getSabyPlansFromCatalog,
  getSabyPlanAmount,
  type SabyBillingCurrency,
  type SabyBillingPeriod,
  type SabyPricingCatalog,
  type SabyPlanTier,
} from './saby-pricing-plans';
import { useGeoCountry } from './use-geo-country';

export type PricingBillingPeriod = SabyBillingPeriod;

type SabyPricingSectionProps = {
  isLightTheme: boolean;
  billingPeriod: PricingBillingPeriod;
  onBillingPeriodChange: (period: PricingBillingPeriod) => void;
  initialPlanId?: SabyPlanTier;
  initialCurrency?: SabyBillingCurrency;
};

export default function SabyPricingSection({
  isLightTheme,
  billingPeriod,
  onBillingPeriodChange,
  initialPlanId,
  initialCurrency = 'USD',
}: SabyPricingSectionProps) {
  const { defaultCurrency: geoDefaultCurrency, loading: geoLoading } =
    useGeoCountry();
  const [showNgn, setShowNgn] = useState(initialCurrency === 'NGN');
  const [catalog, setCatalog] = useState<SabyPricingCatalog | null>(null);

  useEffect(() => {
    if (!geoLoading && geoDefaultCurrency === 'NGN' && initialCurrency !== 'NGN') {
      setShowNgn(true);
    }
  }, [geoLoading, geoDefaultCurrency, initialCurrency]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/subscriptions/catalog', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: any) => {
        if (!mounted) return;
        setCatalog((data?.catalog || data) as SabyPricingCatalog);
      })
      .catch(() => {
        if (mounted) setCatalog(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const logoSrc = isLightTheme ? '/saby-logo.png' : '/logo-short-light.png';
  const selectedCurrency: SabyBillingCurrency = showNgn ? 'NGN' : 'USD';
  const plans = useMemo(() => getSabyPlansFromCatalog(catalog), [catalog]);

  return (
    <section
      id="pricing-section"
      className={`relative px-4 pb-16 pt-[4.5rem] sm:px-6 sm:pb-20 lg:px-8 ${
        isLightTheme ? 'bg-[#f5f5f3]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[860px] text-center">
          <Image
            src={logoSrc}
            alt="Saby logo"
            width={56}
            height={56}
            className={
              isLightTheme
                ? 'mx-auto h-20 w-20 sm:h-24 sm:w-24'
                : 'mx-auto h-7 w-7 sm:h-9 sm:w-9'
            }
          />
          <h2
            className={`mt-4 text-4xl font-semibold tracking-tight sm:text-5xl ${
              isLightTheme ? 'text-[#111827]' : 'text-white'
            }`}
          >
            Pricing
          </h2>
          <p
            className={`mx-auto mt-4 max-w-[720px] text-base leading-relaxed sm:text-lg ${
              isLightTheme ? 'text-[#556481]' : 'text-[#b6bdd1]'
            }`}
          >
            Choose a plan and add optional capabilities during checkout.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <div
              className={`inline-flex rounded-full border p-1 ${
                isLightTheme
                  ? 'border-[#ced7e8] bg-white'
                  : 'border-white/15 bg-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => onBillingPeriodChange('monthly')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                  billingPeriod === 'monthly'
                    ? isLightTheme
                      ? 'bg-[#111827] text-white'
                      : 'bg-white text-[#111827]'
                    : isLightTheme
                      ? 'text-[#1f2b45] hover:bg-[#eef3ff]'
                      : 'text-[#d8ddec] hover:bg-white/10'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => onBillingPeriodChange('annual')}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                  billingPeriod === 'annual'
                    ? isLightTheme
                      ? 'bg-[#111827] text-white'
                      : 'bg-white text-[#111827]'
                    : isLightTheme
                      ? 'text-[#1f2b45] hover:bg-[#eef3ff]'
                      : 'text-[#d8ddec] hover:bg-white/10'
                }`}
              >
                Annual <span className="font-semibold text-[#10b981]">-20%</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowNgn(!showNgn)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                showNgn
                  ? 'border-[#10b981] bg-[#10b981] text-white'
                  : isLightTheme
                    ? 'border-[#ced7e8] text-[#556481]'
                    : 'border-white/15 text-[#b6bdd1]'
              }`}
            >
              {showNgn ? '₦ NGN' : 'USD $'}
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isEnterprise = Boolean(plan.contactSalesOnly);
            const checkoutHref = isEnterprise
              ? 'https://cal.example.com/saby-demo'
              : buildCheckoutPath({
                  plan: plan.id,
                  period: billingPeriod,
                  currency: selectedCurrency,
                });
            const rawPrice = getSabyPlanAmount({
              plan,
              period: billingPeriod,
              currency: selectedCurrency,
            });
            const displayedPrice = isEnterprise
              ? null
              : billingPeriod === 'annual'
                ? Math.round(rawPrice / 12)
                : rawPrice;
            const displayedPeriod = plan.monthlyPeriodLabel ?? 'per month';

            return (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col overflow-hidden rounded-[20px] border shadow-[0_20px_50px_rgba(0,0,0,0.25)] ${
                  plan.popular && !isEnterprise
                    ? 'ring-2 ring-[#2563eb] z-10'
                    : ''
                } ${
                  isEnterprise
                    ? 'border-[#1e293b] bg-[#0f172a]'
                    : plan.popular
                      ? ''
                      : isLightTheme
                        ? 'border-[#d6dfef] bg-white'
                        : 'border-white/10 bg-[linear-gradient(180deg,rgba(30,33,40,0.95)_0%,rgba(22,24,30,0.95)_100%)]'
                } ${
                  !isEnterprise && !plan.popular
                    ? isLightTheme
                      ? 'border-[#d6dfef] bg-white'
                      : 'border-white/10 bg-[linear-gradient(180deg,rgba(30,33,40,0.95)_0%,rgba(22,24,30,0.95)_100%)]'
                    : ''
                }`}
              >
                {plan.popular && !isEnterprise && (
                  <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-[#2563eb] px-4 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-md">
                    Most popular
                  </div>
                )}
                <div className="p-5 pt-10 sm:p-6 sm:pt-11">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className={`text-[1.6rem] font-semibold ${
                          isEnterprise ? 'text-white' : isLightTheme ? 'text-[#111827]' : 'text-white'
                        }`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`mt-2 min-h-[74px] text-[0.95rem] leading-relaxed ${
                          isEnterprise ? 'text-[#94a3b8]' : isLightTheme ? 'text-[#4e5f7e]' : 'text-[#d5d8e2]'
                        }`}
                      >
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap items-end gap-2">
                    {isEnterprise ? (
                      <span className="text-4xl font-semibold tracking-tight text-white">
                        Custom
                      </span>
                    ) : (
                      <>
                        <span
                          className={`text-4xl font-semibold tracking-tight ${
                            isLightTheme ? 'text-[#111827]' : 'text-white'
                          }`}
                        >
                          {selectedCurrency === 'NGN' ? '₦' : '$'}
                          {displayedPrice!.toLocaleString()}
                        </span>
                        <span
                          className={`pb-1 text-[0.92rem] ${
                            isLightTheme ? 'text-[#4f607f]' : 'text-[#c7ccda]'
                          }`}
                        >
                          {displayedPeriod}
                        </span>
                      </>
                    )}
                  </div>

                  {isEnterprise ? (
                    <a
                      href={checkoutHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-[0.95rem] font-medium text-white transition hover:bg-white/20"
                    >
                      Schedule a Demo
                    </a>
                  ) : (
                    <Link
                      href={checkoutHref}
                      className={`mt-6 flex h-12 w-full items-center justify-center rounded-xl border px-5 text-[0.95rem] font-medium transition ${
                        plan.highlightCta
                          ? 'border-[#2563eb] bg-[#2563eb] text-white hover:brightness-110'
                          : isLightTheme
                            ? 'border-[#cdd8ec] text-[#18263f] hover:bg-[#eef3ff]'
                            : 'border-white/20 text-white hover:bg-white/10'
                      }`}
                    >
                      {`Start with ${plan.name}`}
                    </Link>
                  )}
                </div>

                <div className="flex-1 p-5 pt-0 sm:p-6 sm:pt-0">
                  <p
                    className={`text-[0.95rem] ${
                      isEnterprise ? 'text-[#cbd5e1]' : isLightTheme ? 'text-[#31415f]' : 'text-[#e2e6f1]'
                    }`}
                  >
                    {plan.featureHeading}
                  </p>

                  <ul className="mt-4 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={`${plan.name}-${feature}`}
                        className={`flex items-start gap-2 text-[0.93rem] ${
                          isEnterprise ? 'text-[#94a3b8]' : isLightTheme ? 'text-[#334463]' : 'text-[#d9ddeb]'
                        }`}
                      >
                        <Check className={`mt-[2px] h-3.5 w-3.5 shrink-0 ${isEnterprise ? 'text-[#60a5fa]' : ''}`} />
                        <span className="leading-relaxed">{feature}</span>
                        {feature.includes('monthly') ? (
                          <CircleHelp className="mt-[2px] h-3.5 w-3.5 shrink-0 opacity-70" />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>


      </div>
    </section>
  );
}
