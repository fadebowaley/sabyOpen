'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Check,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import PublicAuthModal from './public-auth-modal';
import PublicThemeToggleButton from './public-theme-toggle-button';
import { useGeoCountry } from './use-geo-country';
import {
  calculateRecurringCharge,
  getAddonCatalogForPlan,
  getSabyAddonAmount,
  getSabyPlanAmount,
  type SabyPricingCatalog,
  type SabyPricingPlan,
  type SabyBillingCurrency,
  type SabyBillingPeriod,
  type SabyPricingAddonId,
  type SabyPlanTier,
  normalizeSabyAddonIds,
} from './saby-pricing-plans';
import { usePublicTheme, type PublicThemeMode } from './use-public-theme';

type PaymentProvider = 'paystack' | 'flutterwave';
const CHECKOUT_CURRENCY_STORAGE_KEY = 'saby:checkout:currency';

const PAYMENT_PROVIDERS: Array<{
  id: PaymentProvider;
  label: string;
  lightLogo: string;
  darkLogo: string;
  activeClass: string;
}> = [
  {
    id: 'paystack',
    label: 'Paystack',
    lightLogo: '/Paystack/paystack_onblack.svg',
    darkLogo: '/Paystack/paystack_onwhite.png',
    activeClass: 'border-[#0ba360] bg-[#f3fbf6] text-[#0b7f4c]',
  },
  {
    id: 'flutterwave',
    label: 'Flutterwave',
    lightLogo: '/Flutterwave/Flutterwave_on_black.svg',
    darkLogo: '/Flutterwave/Flutterwave_on_white.svg',
    activeClass: 'border-[#f59e0b] bg-[#fff9ef] text-[#b45309]',
  },
];

const normalizePeriod = (value?: string | null): SabyBillingPeriod =>
  value === 'annual' ? 'annual' : 'monthly';

const normalizeCurrency = (value?: string | null): SabyBillingCurrency =>
  String(value || '').toUpperCase() === 'USD' ? 'USD' : 'NGN';

const readStoredCheckoutCurrency = (): SabyBillingCurrency | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(CHECKOUT_CURRENCY_STORAGE_KEY);
    return stored ? normalizeCurrency(stored) : null;
  } catch {
    return null;
  }
};

const persistCheckoutCurrency = (nextCurrency: SabyBillingCurrency) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CHECKOUT_CURRENCY_STORAGE_KEY, nextCurrency);
  } catch {
    // Persistence is best-effort; URL state still carries the checkout currency.
  }
};

const normalizeProvider = (value?: string | null): PaymentProvider =>
  String(value || '')
    .trim()
    .toLowerCase() === 'flutterwave'
    ? 'flutterwave'
    : 'paystack';

const currencySymbol = (currency: SabyBillingCurrency) =>
  currency === 'NGN' ? '₦' : '$';

const roundChargeAmount = (amount: number, currency: SabyBillingCurrency) => {
  if (currency === 'NGN') {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
};

export default function SabyCheckoutPage({
  initialTheme = 'dark',
}: {
  initialTheme?: PublicThemeMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const {
    country: geoCountry,
    defaultCurrency: geoDefaultCurrency,
    loading: geoLoading,
  } = useGeoCountry();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });

  const initialPlanId = String(searchParams?.get('plan') || '')
    .trim()
    .toLowerCase();
  const initialAddOnIds = String(searchParams?.get('addOns') || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) as SabyPricingAddonId[];
  const [catalog, setCatalog] = useState<SabyPricingCatalog | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SabyPlanTier>(
    initialPlanId
  );
  const [billingPeriod, setBillingPeriod] = useState<SabyBillingPeriod>(
    normalizePeriod(searchParams?.get('period'))
  );
  const [currency, setCurrency] = useState<SabyBillingCurrency>(() => {
    const urlCurrency = searchParams?.get('currency');
    if (urlCurrency) return normalizeCurrency(urlCurrency);
    return readStoredCheckoutCurrency() || 'NGN';
  });
  const [hasUserCurrencyPreference, setHasUserCurrencyPreference] = useState(
    Boolean(searchParams?.get('currency') || readStoredCheckoutCurrency())
  );
  const [userChangedCurrencyInSession, setUserChangedCurrencyInSession] =
    useState(false);
  const [selectedAddonIds, setSelectedAddonIds] =
    useState<SabyPricingAddonId[]>(initialAddOnIds);
  const [provider, setProvider] = useState<PaymentProvider>(
    normalizeProvider(searchParams?.get('provider'))
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(
    Boolean(searchParams?.get('code'))
  );
  const [codeInput, setCodeInput] = useState(
    searchParams?.get('code') || ''
  );
  const [appliedCode, setAppliedCode] = useState(
    searchParams?.get('code') || ''
  );

  const hasUrlCurrency = Boolean(searchParams?.get('currency'));
  useEffect(() => {
    if (hasUrlCurrency) {
      persistCheckoutCurrency(currency);
      setHasUserCurrencyPreference(true);
      return;
    }
    const storedCurrency = readStoredCheckoutCurrency();
    if (storedCurrency) {
      setCurrency(storedCurrency);
      setHasUserCurrencyPreference(true);
      updateCheckoutUrl({ currency: storedCurrency });
    }
    // Run only on mount or when the URL starts carrying an explicit currency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUrlCurrency]);

  useEffect(() => {
    if (
      !geoLoading &&
      geoCountry === 'NG' &&
      !userChangedCurrencyInSession &&
      currency !== 'NGN'
    ) {
      setCurrency('NGN');
      persistCheckoutCurrency('NGN');
      setHasUserCurrencyPreference(true);
      updateCheckoutUrl({ currency: 'NGN' });
      return;
    }

    if (!hasUrlCurrency && readStoredCheckoutCurrency()) {
      return;
    }
    if (
      !hasUrlCurrency &&
      !hasUserCurrencyPreference &&
      !geoLoading &&
      geoDefaultCurrency
    ) {
      setCurrency(geoDefaultCurrency);
      persistCheckoutCurrency(geoDefaultCurrency);
      setHasUserCurrencyPreference(true);
      updateCheckoutUrl({ currency: geoDefaultCurrency });
    }
  }, [
    hasUrlCurrency,
    hasUserCurrencyPreference,
    currency,
    geoLoading,
    geoCountry,
    geoDefaultCurrency,
    userChangedCurrencyInSession,
  ]);

  const catalogPlans = useMemo<SabyPricingPlan[]>(() => {
    if (!catalog?.plans) return [];
    return Array.isArray(catalog.plans)
      ? catalog.plans
      : Object.values(catalog.plans);
  }, [catalog]);
  const selectedPlan = useMemo(
    () =>
      catalogPlans.find((plan) => plan.id === selectedPlanId) ||
      catalogPlans[0] ||
      null,
    [catalogPlans, selectedPlanId]
  );
  const eligibleAddOns = useMemo(
    () => (selectedPlan ? getAddonCatalogForPlan(selectedPlan.id, catalog) : []),
    [catalog, selectedPlan]
  );
  const requiresContactSales = Boolean(selectedPlan?.contactSalesOnly);
  const logoSrc = isLightTheme ? '/saby-logo.png' : '/logo-short-light.png';
  const chargeBreakdown = useMemo(
    () =>
      selectedPlan
        ? calculateRecurringCharge({
            plan: selectedPlan,
            period: billingPeriod,
            currency,
            addonIds: selectedAddonIds,
            catalog,
            code: appliedCode,
          })
        : null,
    [
      billingPeriod,
      currency,
      selectedAddonIds,
      selectedPlan,
      catalog,
      appliedCode,
    ]
  );
  const codeError =
    catalogLoaded &&
    appliedCode &&
    chargeBreakdown?.codeValidation?.valid === false
      ? chargeBreakdown.codeValidation.message || 'Code is invalid or unavailable.'
      : null;
  const isZeroTotalCheckout =
    Boolean(chargeBreakdown) &&
    !requiresContactSales &&
    !codeError &&
    roundChargeAmount(chargeBreakdown?.total || 0, currency) <= 0;
  const pricingReady = Boolean(selectedPlan && chargeBreakdown);
  const selectedPlanName =
    selectedPlan?.name || (catalogLoaded ? 'Pricing unavailable' : 'Loading pricing');
  const liveVatRate = Number(catalog?.vatRate || 0);
  const isAuthenticated = status === 'authenticated';
  const userEmail = session?.user?.email || '';
  const userName = session?.user?.name || '';
  const checkoutSource =
    String(searchParams?.get('source') || '').toLowerCase() === 'billing'
      ? 'billing'
      : 'checkout';
  const callbackPath = `${pathname || '/checkout'}?${(() => {
    const params = new URLSearchParams({
      source: checkoutSource,
      plan: selectedPlanId,
      period: billingPeriod,
      currency,
      provider,
    });
    if (selectedAddonIds.length > 0) {
      params.set('addOns', selectedAddonIds.join(','));
    }
    if (appliedCode) {
      params.set('code', appliedCode);
    }
    return params.toString();
  })()}`;

  const updateCheckoutUrl = (next: {
    plan?: SabyPlanTier;
    period?: SabyBillingPeriod;
    currency?: SabyBillingCurrency;
    provider?: PaymentProvider;
    addOns?: SabyPricingAddonId[];
    code?: string | null;
  }) => {
    const params = new URLSearchParams({
      source: checkoutSource,
      plan: next.plan || selectedPlanId,
      period: next.period || billingPeriod,
      currency: next.currency || currency,
      provider: next.provider || provider,
    });
    const addOnIds = next.addOns || selectedAddonIds;
    if (addOnIds.length > 0) {
      params.set('addOns', addOnIds.join(','));
    }
    const nextCode =
      next.code === undefined ? appliedCode : next.code;
    if (nextCode) {
      params.set('code', nextCode);
    }
    router.replace(`/checkout?${params.toString()}`, { scroll: false });
  };

  const applyCurrency = (nextCurrency: SabyBillingCurrency) => {
    setCurrency(nextCurrency);
    setUserChangedCurrencyInSession(true);
    setHasUserCurrencyPreference(true);
    persistCheckoutCurrency(nextCurrency);
    updateCheckoutUrl({ currency: nextCurrency });
  };

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await fetch('/api/subscriptions/catalog', {
          cache: 'no-store',
        });
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (data?.catalog?.plans) {
          setCatalog(data.catalog as SabyPricingCatalog);
        }
      } catch {
        // Checkout must not invent prices when the backend catalog is unavailable.
      } finally {
        setCatalogLoaded(true);
      }
    };

    void loadCatalog();
  }, []);

  useEffect(() => {
    if (!catalogLoaded || catalogPlans.length === 0) return;
    const hasSelectedPlan = catalogPlans.some(
      (plan) => plan.id === selectedPlanId
    );
    if (!selectedPlanId || !hasSelectedPlan) {
      const nextPlanId = catalogPlans[0].id;
      setSelectedPlanId(nextPlanId);
      updateCheckoutUrl({ plan: nextPlanId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogLoaded, catalogPlans, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlan) return;
    setSelectedAddonIds((current) => {
      const normalized = normalizeSabyAddonIds(
        current,
        selectedPlan.id,
        catalog
      );
      const unchanged =
        normalized.length === current.length &&
        normalized.every((value, index) => value === current[index]);
      if (unchanged) {
        return current;
      }
      updateCheckoutUrl({ addOns: normalized });
      return normalized;
    });
  }, [catalog, selectedPlan]);

  const handleAddonToggle = (addonId: SabyPricingAddonId) => {
    setSelectedAddonIds((current) => {
      const nextAddOns = current.includes(addonId)
        ? current.filter((value) => value !== addonId)
        : [...current, addonId];
      updateCheckoutUrl({ addOns: nextAddOns });
      return nextAddOns;
    });
  };

  const handleStartCheckout = async () => {
    setCheckoutError(null);
    if (!selectedPlan || !chargeBreakdown) {
      setCheckoutError(
        catalogLoaded
          ? 'Pricing could not be loaded. Refresh the page and try again.'
          : 'Pricing is still loading. Please wait.'
      );
      return;
    }
    if (requiresContactSales) {
      window.open('https://cal.example.com/saby-demo', '_blank', 'noopener,noreferrer');
      return;
    }
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (codeError) {
      setCheckoutError(codeError);
      return;
    }
    setIsProcessing(true);
    try {
      const returnUrl = new URL('/checkout/return', window.location.origin);
      returnUrl.searchParams.set(
        'source',
        String(searchParams?.get('source') || '').toLowerCase() === 'billing'
          ? 'billing'
          : 'checkout'
      );
      returnUrl.searchParams.set('plan', selectedPlanId);
      returnUrl.searchParams.set('period', billingPeriod);
      returnUrl.searchParams.set('currency', currency);
      returnUrl.searchParams.set('provider', provider);
      if (selectedAddonIds.length > 0) {
        returnUrl.searchParams.set('addOns', selectedAddonIds.join(','));
      }
      if (appliedCode) {
        returnUrl.searchParams.set('code', appliedCode);
      }

      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlanId,
          billingPeriod,
          currency,
          addOns: selectedAddonIds,
          code: appliedCode || undefined,
          provider,
          returnUrl: returnUrl.toString(),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        throw new Error(
          String(
            payload?.message || payload?.error || 'Unable to start checkout.'
          )
        );
      }
      const checkout = payload?.checkout as Record<string, unknown> | undefined;
      if (String(checkout?.mode || '') === 'manual_zero_total') {
        const payment = payload?.payment as Record<string, unknown> | undefined;
        const paymentId = String(payment?.id || payment?._id || '');
        const paymentReference = String(payment?.reference || '');
        const manualReturnUrl = new URL('/checkout/return', window.location.origin);
        manualReturnUrl.searchParams.set(
          'source',
          String(searchParams?.get('source') || '').toLowerCase() === 'billing'
            ? 'billing'
            : 'checkout'
        );
        manualReturnUrl.searchParams.set('plan', selectedPlanId);
        manualReturnUrl.searchParams.set('period', billingPeriod);
        manualReturnUrl.searchParams.set('currency', currency);
        manualReturnUrl.searchParams.set('provider', 'full_credit');
        manualReturnUrl.searchParams.set('status', 'completed');
        if (paymentId) {
          manualReturnUrl.searchParams.set('payment_id', paymentId);
        }
        if (paymentReference) {
          manualReturnUrl.searchParams.set('payment_reference', paymentReference);
          manualReturnUrl.searchParams.set('reference', paymentReference);
        }
        if (selectedAddonIds.length > 0) {
          manualReturnUrl.searchParams.set('addOns', selectedAddonIds.join(','));
        }
        if (appliedCode) {
          manualReturnUrl.searchParams.set('code', appliedCode);
        }
        window.location.href = manualReturnUrl.toString();
        return;
      }
      const authorizationUrl = String(
        checkout?.authorizationUrl || payload?.authorizationUrl || ''
      );
      if (!authorizationUrl) {
        throw new Error(
          String(
            (checkout as Record<string, unknown>)?.message ||
              'Payment checkout is not available.'
          )
        );
      }
      window.location.href = authorizationUrl;
    } catch (error: any) {
      setCheckoutError(error?.message || 'Unable to start checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyCode = () => {
    const normalized = codeInput.trim().toUpperCase();
    setCheckoutError(null);
    setAppliedCode(normalized);
    updateCheckoutUrl({ code: normalized || null });
  };

  const handleClearCode = () => {
    setCheckoutError(null);
    setCodeInput('');
    setAppliedCode('');
    setIsPromoOpen(false);
    updateCheckoutUrl({ code: null });
  };

  return (
    <div
      className={`min-h-screen ${isLightTheme ? 'bg-[#f5f5f3] text-[#111827]' : 'bg-[#10141d] text-white'}`}
    >
      <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </Link>
          <PublicThemeToggleButton
            mode={isLightTheme ? 'light' : 'dark'}
            onChange={toggleTheme}
          />
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section>
            <div className="flex items-center gap-3">
              <Image
                src={logoSrc}
                alt="Saby"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  Saby Checkout
                </p>
                <h1
                  className={`mt-1 text-3xl font-semibold tracking-tight sm:text-5xl ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  Start your workspace with the right plan.
                </h1>
              </div>
            </div>
            <p
              className={`mt-5 max-w-[620px] text-base leading-relaxed ${isLightTheme ? 'text-[#556481]' : 'text-[#b6bdd1]'}`}
            >
              Choose a plan, create your owner account, and complete secure
              payment. After payment, you will continue to workspace onboarding.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {!catalogLoaded ? (
                <div
                  className={`rounded-2xl border p-4 text-sm ${
                    isLightTheme
                      ? 'border-[#d7dfed] bg-white text-[#64748b]'
                      : 'border-white/15 bg-white/[0.04] text-white/60'
                  }`}
                >
                  Loading live pricing...
                </div>
              ) : catalogPlans.length === 0 ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                  Pricing could not be loaded. Refresh the page before
                  continuing.
                </div>
              ) : null}
              {catalogPlans.map((plan) => {
                const selected = plan.id === selectedPlanId;
                const isEnterprise = Boolean(plan.contactSalesOnly);
                const rawPlanAmount = getSabyPlanAmount({
                  plan,
                  period: billingPeriod,
                  currency,
                });
                const planAmount = isEnterprise
                  ? null
                  : billingPeriod === 'annual'
                    ? Math.round(rawPlanAmount / 12)
                    : rawPlanAmount;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      updateCheckoutUrl({ plan: plan.id });
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isEnterprise
                        ? 'border-[#1e293b] bg-[#0f172a] text-white'
                        : selected
                          ? isLightTheme
                            ? 'border-[#2563eb] bg-[#eef4ff] text-[#111827] ring-2 ring-[#2563eb]/20'
                            : 'border-[#2f7cff] bg-[#10234a]/75 text-white ring-2 ring-[#2f7cff]/35'
                          : isLightTheme
                            ? 'border-[#d7dfed] bg-white hover:bg-[#f8faff]'
                            : 'border-white/15 bg-white/[0.04] text-white hover:border-[#2f7cff]/60 hover:bg-[#10234a]/35'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{plan.name}</p>
                        <p
                          className={`mt-1 text-xs ${
                            isEnterprise
                              ? 'text-[#94a3b8]'
                              : selected
                                ? isLightTheme
                                  ? 'text-[#64748b]'
                                  : 'text-blue-100/75'
                                : isLightTheme
                                  ? 'text-[#64748b]'
                                  : 'text-white/60'
                          }`}
                        >
                          {plan.note}
                        </p>
                      </div>
                      {selected ? (
                        <Check className="h-5 w-5 text-[#2563eb]" />
                      ) : null}
                    </div>
                    <p className="mt-3 text-2xl font-semibold">
                      {isEnterprise ? (
                        'Custom'
                      ) : (
                        <>
                          {currencySymbol(currency)}
                          {roundChargeAmount(planAmount!, currency).toLocaleString()}
                          <span
                            className={`text-sm font-medium ${
                              selected
                                ? isLightTheme
                                  ? 'text-[#64748b]'
                                  : 'text-blue-100/75'
                                : isLightTheme
                                  ? 'text-[#64748b]'
                                  : 'text-white/60'
                            }`}
                          >
                            /mo
                          </span>
                        </>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedPlan && !requiresContactSales ? (
              <div
                className={`mt-5 rounded-[24px] border p-4 ${
                  isLightTheme
                    ? 'border-[#d7dfed] bg-white'
                    : 'border-white/10 bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isLightTheme ? 'text-[#111827]' : 'text-white'
                      }`}
                    >
                      Add optional capabilities
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isLightTheme ? 'text-[#64748b]' : 'text-white/60'
                      }`}
                    >
                      Choose only the extras you want on this subscription.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isLightTheme
                        ? 'bg-[#eef4ff] text-[#2563eb]'
                        : 'bg-[#10234a] text-[#9ec5ff]'
                    }`}
                  >
                    {selectedAddonIds.length} selected
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {eligibleAddOns.map((addon) => {
                    const selected = selectedAddonIds.includes(addon.id);
                    const addonAmount = getSabyAddonAmount({
                      addon,
                      period: billingPeriod,
                      currency,
                    });

                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => handleAddonToggle(addon.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? isLightTheme
                              ? 'border-[#2563eb] bg-[#eef4ff] text-[#111827] ring-2 ring-[#2563eb]/15'
                              : 'border-[#2f7cff] bg-[#10234a]/75 text-white ring-2 ring-[#2f7cff]/30'
                            : isLightTheme
                              ? 'border-[#d7dfed] bg-[#f8fafc] text-[#111827] hover:bg-white'
                              : 'border-white/10 bg-[#151c2b] text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {addon.name}
                            </p>
                            <p
                              className={`mt-1 text-xs leading-relaxed ${
                                isLightTheme
                                  ? 'text-[#64748b]'
                                  : 'text-white/60'
                              }`}
                            >
                              {addon.description}
                            </p>
                          </div>
                          {selected ? (
                            <Check className="h-4 w-4 text-[#2563eb]" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-semibold">
                          {currencySymbol(currency)}
                          {roundChargeAmount(
                            addonAmount,
                            currency
                          ).toLocaleString()}
                          <span
                            className={`ml-1 text-xs font-medium ${
                              isLightTheme ? 'text-[#64748b]' : 'text-white/60'
                            }`}
                          >
                            {billingPeriod === 'annual' ? '/yr' : '/mo'}
                          </span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <aside
            className={`rounded-[28px] border p-5 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:p-7 ${
              isLightTheme
                ? 'border-[#d7dfed] bg-white'
                : 'border-white/10 bg-white/[0.05]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-sm font-medium ${isLightTheme ? 'text-[#64748b]' : 'text-white/60'}`}
                >
                  Subscription summary
                </p>
                <h2
                  className={`mt-1 text-2xl font-semibold ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  {selectedPlanName}
                </h2>
              </div>
              <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#047857]">
                {requiresContactSales ? 'Sales assisted' : 'Secure checkout'}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div
                className={`rounded-2xl border p-3 ${isLightTheme ? 'border-[#e2e8f0] bg-[#f8fafc]' : 'border-white/10 bg-white/[0.04]'}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
                  Billing
                </p>
                <div className="mt-2 flex rounded-full border border-[#d7dfed] bg-white p-1">
                  {(['monthly', 'annual'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        setBillingPeriod(period);
                        updateCheckoutUrl({ period });
                      }}
                      className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                        billingPeriod === period
                          ? 'bg-[#111827] text-white'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className={`rounded-2xl border p-3 ${isLightTheme ? 'border-[#e2e8f0] bg-[#f8fafc]' : 'border-white/10 bg-white/[0.04]'}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
                  Currency
                </p>
                <div className="mt-2 flex rounded-full border border-[#d7dfed] bg-white p-1">
                  {(['NGN', 'USD'] as const).map((nextCurrency) => (
                    <button
                      key={nextCurrency}
                      type="button"
                      onClick={() => applyCurrency(nextCurrency)}
                      className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        currency === nextCurrency
                          ? 'bg-[#111827] text-white'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {nextCurrency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`mt-5 rounded-2xl border p-4 ${
                isLightTheme
                  ? 'border-[#e2e8f0] bg-[#f8fafc] text-[#111827]'
                  : 'border-white/12 bg-[#151c2b] text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                      isLightTheme ? 'text-[#64748b]' : 'text-white/45'
                    }`}
                  >
                    Invoice summary
                  </p>
                  <p className="mt-1 text-base font-semibold">
                    {selectedPlanName}
                  </p>
                </div>
                <strong className="text-lg">
                  {chargeBreakdown
                    ? `${currencySymbol(currency)}${roundChargeAmount(
                        chargeBreakdown.total,
                        currency
                      ).toLocaleString()}`
                    : '—'}
                </strong>
              </div>
              <div
                className={`mt-4 space-y-2 border-t pt-3 text-sm ${
                  isLightTheme
                    ? 'border-[#e2e8f0] text-[#64748b]'
                    : 'border-white/10 text-white/60'
                }`}
              >
                <div className="flex justify-between gap-4">
                  <span>{selectedPlanName}</span>
                  <span>
                    {chargeBreakdown
                      ? `${currencySymbol(currency)}${roundChargeAmount(
                          chargeBreakdown.planSubtotal,
                          currency
                        ).toLocaleString()}`
                      : '—'}
                  </span>
                </div>
                {chargeBreakdown?.addOns.map((addon) => (
                  <div key={addon.id} className="flex justify-between gap-4">
                    <span>{addon.name}</span>
                    <span>
                      {currencySymbol(currency)}
                      {roundChargeAmount(
                        getSabyAddonAmount({
                          addon,
                          period: billingPeriod,
                          currency,
                        }),
                        currency
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between gap-4">
                  <span>Billing cycle</span>
                  <span>
                    {billingPeriod === 'annual' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Subtotal</span>
                  <span>
                    {chargeBreakdown
                      ? `${currencySymbol(currency)}${roundChargeAmount(
                          chargeBreakdown.subtotal,
                          currency
                        ).toLocaleString()}`
                      : '—'}
                  </span>
                </div>
                {Number(chargeBreakdown?.discount?.amount || 0) > 0 ? (
                  <div className="flex justify-between gap-4 text-[#059669]">
                    <span>
                      {chargeBreakdown?.resolvedType === 'discount'
                        ? `Discount (${appliedCode})`
                        : chargeBreakdown?.resolvedType === 'promo'
                          ? `Promo (${appliedCode})`
                          : chargeBreakdown?.discount?.appliedRules?.[0]?.label || 'Discount'}
                    </span>
                    <span>
                      -{currencySymbol(currency)}
                      {roundChargeAmount(
                        chargeBreakdown?.discount?.amount || 0,
                        currency
                      ).toLocaleString()}
                    </span>
                  </div>
                ) : null}
                {Number(chargeBreakdown?.credits?.amount || 0) > 0 ? (
                  <div className="flex justify-between gap-4">
                    <span>
                      {chargeBreakdown?.resolvedType === 'credit'
                        ? `Credit (${appliedCode})`
                        : 'Credits'}
                    </span>
                    <span>
                      -{currencySymbol(currency)}
                      {roundChargeAmount(
                        chargeBreakdown?.credits?.amount || 0,
                        currency
                      ).toLocaleString()}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <span>
                    VAT (
                    {Math.round(liveVatRate * 1000) / 10}
                    %)
                  </span>
                  <span>
                    {chargeBreakdown
                      ? `${currencySymbol(currency)}${roundChargeAmount(
                          chargeBreakdown.tax,
                          currency
                        ).toLocaleString()}`
                      : '—'}
                  </span>
                </div>
                {!pricingReady ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Live pricing is required before checkout can continue.
                  </p>
                ) : null}
              </div>
              <div
                className={`mt-3 border-t pt-3 ${
                  isLightTheme ? 'border-[#e2e8f0]' : 'border-white/10'
                }`}
              >
                {!isPromoOpen ? (
                  <button
                    type="button"
                    onClick={() => setIsPromoOpen(true)}
                    className={`text-sm font-semibold ${
                      isLightTheme ? 'text-[#2563eb]' : 'text-[#93c5fd]'
                    }`}
                  >
                    Have a promo, discount, or credit code?
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="Enter code"
                        className={`h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none ${
                          isLightTheme
                            ? 'border-[#d7dfed] bg-white text-[#111827]'
                            : 'border-white/15 bg-[#101827] text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCode}
                        className="h-10 rounded-xl bg-[#111827] px-4 text-sm font-semibold text-white"
                      >
                        Apply
                      </button>
                      {appliedCode && (
                        <button
                          type="button"
                          onClick={handleClearCode}
                          className={`h-10 rounded-xl border px-3 text-sm font-semibold ${
                            isLightTheme
                              ? 'border-[#d7dfed] text-[#64748b]'
                              : 'border-white/15 text-white/70'
                          }`}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {codeError ? (
                      <p className="text-xs font-medium text-red-500">
                        {codeError}
                      </p>
                    ) : appliedCode &&
                      chargeBreakdown?.codeValidation?.valid ? (
                      <p className="text-xs font-medium text-emerald-600">
                        {chargeBreakdown?.resolvedType === 'discount'
                          ? `Discount code ${appliedCode} applied.`
                          : chargeBreakdown?.resolvedType === 'promo'
                            ? `Promo code ${appliedCode} applied.`
                            : chargeBreakdown?.resolvedType === 'credit'
                              ? `Credit code ${appliedCode} applied.`
                              : `Code ${appliedCode} applied.`}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              <div
                className={`mt-3 border-t pt-3 ${
                  isLightTheme ? 'border-[#e2e8f0]' : 'border-white/10'
                }`}
              >
                <div className="flex justify-between gap-4 text-lg">
                  <span className="font-semibold">Total due today</span>
                  <strong>
                    {chargeBreakdown
                      ? `${currencySymbol(currency)}${roundChargeAmount(
                          chargeBreakdown.total,
                          currency
                        ).toLocaleString()}`
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>

            {pricingReady && !requiresContactSales && !isZeroTotalCheckout ? (
              <div className="mt-5">
                <p
                  className={`mb-2 text-sm font-semibold ${isLightTheme ? 'text-[#334155]' : 'text-white/80'}`}
                >
                  Payment provider
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PAYMENT_PROVIDERS.map((paymentProvider) => {
                    const selectedProvider = provider === paymentProvider.id;
                    const providerLogo = isLightTheme
                      ? paymentProvider.lightLogo
                      : paymentProvider.darkLogo;
                    return (
                      <button
                        key={paymentProvider.id}
                        type="button"
                        onClick={() => {
                          setProvider(paymentProvider.id);
                          updateCheckoutUrl({ provider: paymentProvider.id });
                        }}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                          selectedProvider
                            ? paymentProvider.activeClass
                            : isLightTheme
                              ? 'border-[#d7dfed] bg-white text-[#64748b] hover:bg-[#f8faff]'
                              : 'border-white/12 bg-[#151c2b] text-white/70 hover:border-white/25 hover:bg-[#192235]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Image
                            src={providerLogo}
                            alt={`${paymentProvider.label} logo`}
                            width={84}
                            height={18}
                            className="h-[16px] w-auto object-contain"
                          />
                          {paymentProvider.label}
                        </span>
                        {selectedProvider ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {pricingReady && isZeroTotalCheckout ? (
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                  isLightTheme
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
                }`}
              >
                This checkout is fully covered by the applied credit or promo.
                No payment provider is required.
              </div>
            ) : null}

            {checkoutError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {checkoutError}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleStartCheckout}
              disabled={isProcessing || status === 'loading' || !pricingReady}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isZeroTotalCheckout
                    ? 'Activating subscription...'
                    : 'Preparing payment...'}
                </>
              ) : !pricingReady ? (
                <>
                  <Loader2
                    className={`h-4 w-4 ${catalogLoaded ? '' : 'animate-spin'}`}
                  />
                  {catalogLoaded ? 'Pricing unavailable' : 'Loading pricing...'}
                </>
              ) : requiresContactSales ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Schedule a Demo
                </>
              ) : isZeroTotalCheckout ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Activate subscription
                </>
              ) : isAuthenticated ? (
                <>
                  <LockKeyhole className="h-4 w-4" />
                  Continue to payment
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Create account to continue
                </>
              )}
            </button>

            <p
              className={`mt-3 text-center text-xs ${isLightTheme ? 'text-[#64748b]' : 'text-white/55'}`}
            >
              {requiresContactSales
                ? 'Enterprise plans are tailored to your organization. Schedule a demo to get started.'
                : isAuthenticated
                  ? `Signed in as ${userEmail || userName || 'your account'}`
                  : 'Your selected plan is preserved through signup and OTP verification.'}
            </p>
          </aside>
        </main>
      </div>

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath={callbackPath}
        isLightTheme
        initialView="signup"
        signupAsOwner
        title="Create your owner account"
        description="Create your account to complete subscription and start workspace onboarding."
      />
    </div>
  );
}
