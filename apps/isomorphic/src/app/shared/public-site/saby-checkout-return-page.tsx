'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useCurrentSubscriptionRuntime } from '@/app/lib/subscription/use-current-subscription';
import {
  calculateRecurringCharge,
  findSabyPlan,
  getSabyAddonAmount,
  normalizeSabyAddonIds,
  DEFAULT_SABY_PRICING_CATALOG,
  type SabyBillingCurrency,
  type SabyBillingPeriod,
} from './saby-pricing-plans';
import { usePublicTheme, type PublicThemeMode } from './use-public-theme';
import PublicThemeToggleButton from './public-theme-toggle-button';

const normalizePeriod = (value?: string | null): SabyBillingPeriod =>
  value === 'annual' ? 'annual' : 'monthly';

const normalizeCurrency = (value?: string | null): SabyBillingCurrency =>
  String(value || '').toUpperCase() === 'USD' ? 'USD' : 'NGN';

const currencySymbol = (currency: SabyBillingCurrency) =>
  currency === 'NGN' ? '₦' : '$';

const roundChargeAmount = (amount: number, currency: SabyBillingCurrency) => {
  if (currency === 'NGN') {
    return Math.round(amount);
  }
  return Math.round(amount * 100) / 100;
};

type ReturnPayment = {
  id?: string;
  _id?: string;
  reference?: string;
  status?: string;
  amount?: number;
  total?: number;
  currency?: string;
  paymentMethod?: string;
  metadata?: Record<string, any>;
};

const downloadReceipt = async ({
  paymentId,
  reference,
}: {
  paymentId?: string | null;
  reference?: string | null;
}) => {
  const target = paymentId
    ? `/api/subscriptions/invoices/${encodeURIComponent(paymentId)}/receipt`
    : reference
      ? `/api/subscriptions/invoices/reference/${encodeURIComponent(reference)}/receipt`
      : null;
  if (!target) {
    throw new Error('Payment reference is missing');
  }

  const response = await fetch(target, { cache: 'no-store' });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Failed to download receipt');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || `saby-receipt-${paymentId || reference}.pdf`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const downloadInvoice = async ({
  paymentId,
  reference,
}: {
  paymentId?: string | null;
  reference?: string | null;
}) => {
  const target = paymentId
    ? `/api/subscriptions/invoices/${encodeURIComponent(paymentId)}/invoice`
    : reference
      ? `/api/subscriptions/invoices/reference/${encodeURIComponent(reference)}/invoice`
      : null;
  if (!target) {
    throw new Error('Payment reference is missing');
  }

  const response = await fetch(target, { cache: 'no-store' });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Failed to download invoice');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || `saby-invoice-${paymentId || reference}.pdf`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

export default function SabyCheckoutReturnPage({
  initialTheme = 'dark',
}: {
  initialTheme?: PublicThemeMode;
}) {
  const searchParams = useSearchParams();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });

  const rawStatus = String(searchParams?.get('status') || '').toLowerCase();
  const transactionStatus = String(
    searchParams?.get('transaction_status') || ''
  ).toLowerCase();
  const explicitFailure = [
    rawStatus,
    transactionStatus,
    String(searchParams?.get('cancelled') || '').toLowerCase(),
  ].some((value) =>
    ['failed', 'failure', 'cancelled', 'canceled', 'abandoned'].includes(value)
  );
  const source =
    String(searchParams?.get('source') || '').toLowerCase() === 'billing'
      ? 'billing'
      : 'checkout';
  const reference =
    searchParams?.get('reference') ||
    searchParams?.get('tx_ref') ||
    searchParams?.get('trxref') ||
    searchParams?.get('payment_reference') ||
    '';
  const rawProvider = String(searchParams?.get('provider') || '')
    .trim()
    .toLowerCase();
  const paystackRef = searchParams?.get('trxref') || searchParams?.get('reference');
  const provider =
    rawProvider ||
    (searchParams?.get('tx_ref') ||
    searchParams?.get('transaction_id') ||
    searchParams?.get('transactionId')
      ? 'flutterwave'
      : paystackRef
        ? 'paystack'
        : '');
  const success =
    rawStatus === 'successful' ||
    rawStatus === 'completed' ||
    transactionStatus === 'successful' ||
    (!explicitFailure && Boolean(reference && provider));

  const selectedPlan = useMemo(
    () => findSabyPlan(searchParams?.get('plan')),
    [searchParams]
  );
  const billingPeriod = normalizePeriod(searchParams?.get('period'));
  const currency = normalizeCurrency(searchParams?.get('currency'));
  const appliedCode = String(searchParams?.get('code') || '')
    .trim()
    .toUpperCase();
  const selectedAddonIds = normalizeSabyAddonIds(
    searchParams?.get('addOns'),
    selectedPlan.id
  );

  const transactionId =
    searchParams?.get('transaction_id') ||
    searchParams?.get('transactionId') ||
    searchParams?.get('id') ||
    '';
  const paymentId =
    searchParams?.get('payment_id') || searchParams?.get('paymentId') || '';
  const providerRequiresVerification = !['full_credit', 'manual'].includes(provider);
  const needsVerification =
    !explicitFailure && !!reference && !!provider && providerRequiresVerification;
  const [verificationDone, setVerificationDone] = useState(!needsVerification);
  const [verifying, setVerifying] = useState(needsVerification);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [receiptDownloading, setReceiptDownloading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [returnPayment, setReturnPayment] = useState<ReturnPayment | null>(
    null
  );

  useEffect(() => {
    if (!needsVerification || verificationDone) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/payments/verify-return', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            paymentReference: reference,
            transactionId,
          }),
        });
        if (!res.ok) {
          const data: any = await res.json().catch(() => ({}));
          throw new Error(data?.message || 'Payment verification failed');
        }
        if (!cancelled) {
          setVerificationDone(true);
          setVerifying(false);
          setVerificationError(null);
        }
      } catch (error: any) {
        if (!cancelled) {
          setVerificationDone(true);
          setVerifying(false);
          setVerificationError(error?.message || 'Payment verification failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsVerification, verificationDone, provider, reference, transactionId]);

  const subscriptionRuntime = useCurrentSubscriptionRuntime({
    enabled: verificationDone,
  });

  useEffect(() => {
    if (!verificationDone || !reference) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/payments/reference/${encodeURIComponent(reference)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const payment = (await res
          .json()
          .catch(() => null)) as ReturnPayment | null;
        if (!cancelled && payment) {
          setReturnPayment(payment);
        }
      } catch {
        // Keep the URL/catalog fallback if payment hydration is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reference, verificationDone]);

  const liveSubscription = success ? subscriptionRuntime.subscription : null;
  const effectivePlan = useMemo(
    () =>
      liveSubscription ? findSabyPlan(liveSubscription.planId) : selectedPlan,
    [liveSubscription, selectedPlan]
  );
  const effectiveBillingPeriod =
    liveSubscription &&
    String(liveSubscription.billingPeriod || '')
      .trim()
      .toLowerCase() === 'annual'
      ? 'annual'
      : liveSubscription
        ? 'monthly'
        : billingPeriod;
  const effectiveCurrency = liveSubscription
    ? normalizeCurrency(liveSubscription.currency || null)
    : currency;
  const effectiveAddonIds = liveSubscription
    ? normalizeSabyAddonIds(
        Array.isArray(liveSubscription.addOns)
          ? liveSubscription.addOns
              .map((addon) =>
                typeof addon === 'string'
                  ? addon
                  : String(addon?.id || '').trim()
              )
              .filter(Boolean)
              .join(',')
          : null,
        effectivePlan.id
      )
    : selectedAddonIds;

  const chargeBreakdown = useMemo(
    () =>
      calculateRecurringCharge({
        plan: effectivePlan,
        period: effectiveBillingPeriod,
        currency: effectiveCurrency,
        addonIds: effectiveAddonIds,
        code: appliedCode || undefined,
      }),
    [
      effectiveAddonIds,
      effectiveBillingPeriod,
      effectiveCurrency,
      effectivePlan,
      appliedCode,
    ]
  );

  const retryHref = useMemo(() => {
    const params = new URLSearchParams({
      source,
      plan: selectedPlan.id,
      period: billingPeriod,
      currency,
    });
    if (provider) {
      params.set('provider', provider);
    }
    if (selectedAddonIds.length > 0) {
      params.set('addOns', selectedAddonIds.join(','));
    }
    if (appliedCode) {
      params.set('code', appliedCode);
    }
    return `/checkout?${params.toString()}`;
  }, [
    billingPeriod,
    currency,
    appliedCode,
    provider,
    selectedAddonIds,
    selectedPlan.id,
    source,
  ]);

  const primaryAction = success
    ? source === 'billing'
      ? { href: '/billing', label: 'Return to billing' }
      : { href: '/studio/onboarding', label: 'Continue onboarding' }
    : {
        href: retryHref,
        label:
          source === 'billing' ? 'Retry billing checkout' : 'Retry checkout',
      };
  const isFinalSuccess = success && !verifying && !verificationError;
  const isProblemState = !verifying && (!success || Boolean(verificationError));
  const logoSrc = isLightTheme ? '/saby-logo.png' : '/logo-short-light.png';
  const paymentMetadata = returnPayment?.metadata || {};
  const paymentInvoiceSnapshot =
    paymentMetadata.invoiceSnapshot &&
    typeof paymentMetadata.invoiceSnapshot === 'object'
      ? paymentMetadata.invoiceSnapshot
      : {};
  const paymentCurrency = normalizeCurrency(
    returnPayment?.currency || paymentMetadata.currency || effectiveCurrency
  );
  const paymentTotal =
    returnPayment &&
    (returnPayment.total != null || returnPayment.amount != null)
      ? Number(returnPayment.total ?? returnPayment.amount ?? 0)
      : null;
  const summaryTotal = paymentTotal ?? chargeBreakdown.total;
  const summaryPlanName =
    String(paymentMetadata.planName || '').trim() || effectivePlan.name;
  const summaryBillingPeriod =
    String(paymentMetadata.billingPeriod || effectiveBillingPeriod)
      .trim()
      .toLowerCase() === 'annual'
      ? 'annual'
      : 'monthly';
  const paymentLineItems = Array.isArray(paymentInvoiceSnapshot.lineItems)
    ? paymentInvoiceSnapshot.lineItems
    : [];
  const summaryLineItems =
    returnPayment && paymentLineItems.length > 0
      ? paymentLineItems.map((item: any, index: number) => ({
          id: String(item.id || item.key || index),
          label: String(item.label || item.name || summaryPlanName),
          amount: Number(item.amount ?? item.total ?? item.unitPrice ?? 0),
        }))
      : returnPayment
        ? [
            {
              id: 'payment-amount',
              label: `${summaryPlanName} plan`,
              amount: summaryTotal,
            },
          ]
        : [
            {
              id: 'plan',
              label: `${effectivePlan.name} plan`,
              amount: chargeBreakdown.planSubtotal,
            },
            ...chargeBreakdown.addOns.map((addon) => ({
              id: addon.id,
              label: addon.name,
              amount: getSabyAddonAmount({
                addon,
                period: effectiveBillingPeriod,
                currency: effectiveCurrency,
              }),
            })),
          ];
  const summarySubtotal =
    returnPayment && paymentMetadata.subtotal != null
      ? Number(paymentMetadata.subtotal)
      : returnPayment
        ? summaryTotal
        : chargeBreakdown.subtotal;
  const summaryTax =
    returnPayment && paymentMetadata.tax != null
      ? Number(paymentMetadata.tax)
      : returnPayment
        ? 0
        : chargeBreakdown.tax;
  const summaryDiscount =
    returnPayment && paymentMetadata.discount != null
      ? Number(paymentMetadata.discount)
      : chargeBreakdown.discount.amount;
  const summaryCredits =
    returnPayment && paymentMetadata.credits != null
      ? Number(paymentMetadata.credits)
      : chargeBreakdown.credits.amount;
  const totalLabel = `${currencySymbol(paymentCurrency)}${roundChargeAmount(
    summaryTotal,
    paymentCurrency
  ).toLocaleString()}`;
  const statusBadgeLabel = verifying
    ? 'Verifying'
    : isFinalSuccess
      ? 'Payment confirmed'
      : 'Payment action needed';
  const heading = verifying
    ? 'Verifying payment'
    : verificationError
      ? 'Payment verification failed'
      : success
        ? 'Payment received'
        : 'Payment not completed';
  const statusMessage = verifying
    ? 'We are confirming your transaction with the payment provider.'
    : verificationError
      ? `${verificationError} If your account was debited, check billing before retrying.`
      : success
        ? source === 'billing'
          ? 'Your subscription update has been confirmed. Review your billing page for the active package and receipts.'
          : liveSubscription
            ? `${effectivePlan.name} is now active for this workspace. Continue to onboarding to finish setup.`
            : 'Your subscription payment has been confirmed. Continue to onboarding to finish setting up your workspace.'
        : 'We could not confirm a completed payment. Retry the payment or download the invoice for reference.';

  return (
    <main
      className={`min-h-screen px-4 py-8 ${
        isLightTheme ? 'bg-[#f6f7f5] text-[#111827]' : 'bg-[#10141d] text-white'
      }`}
    >
      <div className="fixed right-4 top-4 z-50">
        <PublicThemeToggleButton
          mode={isLightTheme ? 'light' : 'dark'}
          onChange={toggleTheme}
        />
      </div>
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1120px] items-center justify-center">
        <div
          className={`w-full rounded-[28px] border p-5 shadow-[0_28px_90px_rgba(15,23,42,0.12)] sm:p-7 ${
            isLightTheme
              ? 'border-[#d7dfed] bg-white'
              : 'border-white/10 bg-white/[0.05]'
          }`}
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src={logoSrc}
                alt="Saby"
                width={28}
                height={28}
                className="h-7 w-auto object-contain"
                priority
              />
              <span
                className={`text-xs font-bold uppercase tracking-[0.28em] ${
                  isLightTheme ? 'text-[#111827]' : 'text-white'
                }`}
              >
                Saby Billing
              </span>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                verifying
                  ? 'border-[#facc15] bg-[#fef9c3] text-[#a16207]'
                  : isFinalSuccess
                    ? 'border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]'
                    : 'border-[#fecdd3] bg-[#fff1f2] text-[#be123c]'
              }`}
            >
              {statusBadgeLabel}
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="text-center lg:text-left">
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full lg:mx-0 ${
                  verifying
                    ? 'bg-[#fef3c7] text-[#d97706]'
                    : isFinalSuccess
                      ? 'bg-[#ecfdf5] text-[#059669]'
                      : 'bg-[#fff1f2] text-[#e11d48]'
                }`}
              >
                {verifying ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : isFinalSuccess ? (
                  <CheckCircle2 className="h-10 w-10" />
                ) : (
                  <XCircle className="h-10 w-10" />
                )}
              </div>
              <h1
                className={`mt-6 text-4xl font-bold tracking-[-0.04em] ${
                  isLightTheme ? 'text-[#111827]' : 'text-white'
                }`}
              >
                {heading}
              </h1>
              <p
                className={`mt-4 max-w-[460px] text-sm leading-7 lg:mx-0 ${
                  isLightTheme ? 'text-[#64748b]' : 'text-white/65'
                } mx-auto`}
              >
                {statusMessage}
              </p>
              {reference ? (
                <div
                  className={`mt-5 rounded-2xl px-4 py-3 text-left text-xs ${
                    isLightTheme
                      ? 'bg-[#f8fafc] text-[#64748b]'
                      : 'bg-white/[0.04] text-white/80'
                  }`}
                >
                  <span className="font-semibold">Payment reference:</span>{' '}
                  <span className="break-all">{reference}</span>
                </div>
              ) : null}
              {receiptError ? (
                <p
                  className={`mt-3 rounded-2xl px-4 py-3 text-xs ${
                    isLightTheme
                      ? 'bg-[#fff1f2] text-[#be123c]'
                      : 'bg-[#3f1720] text-[#fecdd3]'
                  }`}
                >
                  {receiptError}
                </p>
              ) : null}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                {verifying ? null : verificationError ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationDone(false);
                        setVerifying(true);
                        setVerificationError(null);
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111827] px-6 text-sm font-semibold text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry verification
                    </button>
                    <Link
                      href="/billing"
                      className={`inline-flex h-12 items-center justify-center rounded-xl border px-6 text-sm font-semibold ${
                        isLightTheme
                          ? 'border-[#d7dfed] text-[#334155]'
                          : 'border-white/15 text-white/75'
                      }`}
                    >
                      Open billing
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href={primaryAction.href}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#111827] px-6 text-sm font-semibold text-white"
                    >
                      {success ? null : <RotateCcw className="h-4 w-4" />}
                      {primaryAction.label}
                    </Link>
                    {isFinalSuccess && (paymentId || reference) ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setReceiptDownloading(true);
                          setReceiptError(null);
                          try {
                            await downloadReceipt({ paymentId, reference });
                          } catch (error: any) {
                            setReceiptError(
                              error?.message || 'Failed to download receipt'
                            );
                          } finally {
                            setReceiptDownloading(false);
                          }
                        }}
                        disabled={receiptDownloading}
                        className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold ${
                          isLightTheme
                            ? 'border-[#d7dfed] text-[#334155]'
                            : 'border-white/15 text-white/75'
                        }`}
                      >
                        {receiptDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download receipt
                      </button>
                    ) : isProblemState && (paymentId || reference) ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setReceiptDownloading(true);
                          setReceiptError(null);
                          try {
                            await downloadInvoice({ paymentId, reference });
                          } catch (error: any) {
                            setReceiptError(
                              error?.message || 'Failed to download invoice'
                            );
                          } finally {
                            setReceiptDownloading(false);
                          }
                        }}
                        disabled={receiptDownloading}
                        className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-semibold ${
                          isLightTheme
                            ? 'border-[#d7dfed] text-[#334155]'
                            : 'border-white/15 text-white/75'
                        }`}
                      >
                        {receiptDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download invoice
                      </button>
                    ) : null}
                  </>
                )}
                <Link
                  href="/pricing"
                  className={`inline-flex h-12 items-center justify-center rounded-xl border px-6 text-sm font-semibold ${
                    isLightTheme
                      ? 'border-[#d7dfed] text-[#334155]'
                      : 'border-white/15 text-white/75'
                  }`}
                >
                  View plans
                </Link>
              </div>
            </div>

            <aside
              className={`rounded-[24px] border p-5 ${
                isLightTheme
                  ? 'border-[#dbe3ef] bg-[#f8fafc] text-[#111827]'
                  : 'border-white/12 bg-[#151c2b] text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.28em] ${
                      isLightTheme ? 'text-[#64748b]' : 'text-white/45'
                    }`}
                  >
                    Package Summary
                  </p>
                  <p
                    className={`mt-3 text-xl font-bold ${
                      isLightTheme ? 'text-[#111827]' : 'text-white'
                    }`}
                  >
                    {summaryPlanName} plan
                  </p>
                </div>
                <strong
                  className={`text-2xl font-bold tracking-[-0.04em] ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  {totalLabel}
                </strong>
              </div>

              <div
                className={`mt-6 space-y-3 border-t pt-5 text-sm ${
                  isLightTheme
                    ? 'border-[#e2e8f0] text-[#64748b]'
                    : 'border-white/10 text-white/60'
                }`}
              >
                {summaryLineItems.map(
                  (item: { id: string; label: string; amount: number }) => (
                    <div key={item.id} className="flex justify-between gap-4">
                      <span>{item.label}</span>
                      <span>
                        {currencySymbol(paymentCurrency)}
                        {roundChargeAmount(
                          item.amount,
                          paymentCurrency
                        ).toLocaleString()}
                      </span>
                    </div>
                  )
                )}
                <div className="flex justify-between gap-4">
                  <span>Billing cycle</span>
                  <span>
                    {summaryBillingPeriod === 'annual' ? 'Annual' : 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Subtotal</span>
                  <span>
                    {currencySymbol(paymentCurrency)}
                    {roundChargeAmount(
                      summarySubtotal,
                      paymentCurrency
                    ).toLocaleString()}
                  </span>
                </div>
                {summaryDiscount > 0 ? (
                  (() => {
                    const metaCode = paymentMetadata.promoCode || paymentMetadata.discountCode || appliedCode;
                    const resolvedType = chargeBreakdown.resolvedType;
                    const label = resolvedType === 'promo'
                      ? `Promo (${metaCode})`
                      : resolvedType === 'discount'
                        ? `Discount (${metaCode})`
                        : paymentMetadata.promoCode
                          ? `Promo (${paymentMetadata.promoCode})`
                          : 'Discount';
                    return (
                      <div className="flex justify-between gap-4 text-[#059669]">
                        <span>{label}</span>
                        <span>
                          -{currencySymbol(paymentCurrency)}
                          {roundChargeAmount(summaryDiscount, paymentCurrency).toLocaleString()}
                        </span>
                      </div>
                    );
                  })()
                ) : null}
                <div className="flex justify-between gap-4">
                  <span>
                    VAT (
                    {summaryTax > 0
                      ? `${Math.round((DEFAULT_SABY_PRICING_CATALOG.vatRate || 0.075) * 1000) / 10}%`
                      : '0%'}
                    )
                  </span>
                  <span>
                    {currencySymbol(paymentCurrency)}
                    {roundChargeAmount(
                      summaryTax,
                      paymentCurrency
                    ).toLocaleString()}
                  </span>
                </div>
                {summaryCredits > 0 ? (
                  <div className="flex justify-between gap-4 text-[#059669]">
                    <span>
                      {chargeBreakdown.resolvedType === 'credit'
                        ? `Credit (${appliedCode})`
                        : 'Credits'}
                    </span>
                    <span>
                      -{currencySymbol(paymentCurrency)}
                      {roundChargeAmount(
                        summaryCredits,
                        paymentCurrency
                      ).toLocaleString()}
                    </span>
                  </div>
                ) : null}
                <div
                  className={`flex justify-between gap-4 border-t pt-4 text-base font-bold ${
                    isLightTheme
                      ? 'border-[#e2e8f0] text-[#111827]'
                      : 'border-white/10 text-white'
                  }`}
                >
                  <span>{isFinalSuccess ? 'Amount paid' : 'Amount due'}</span>
                  <span>{totalLabel}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
