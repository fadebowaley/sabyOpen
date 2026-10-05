'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileText,
  Loader2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import PublicAuthModal from '@/app/shared/public-site/public-auth-modal';
import PublicThemeToggleButton from '@/app/shared/public-site/public-theme-toggle-button';
import SabyAiTokensSection from '@/app/shared/public-site/saby-ai-tokens-section';
import {
  usePublicTheme,
  type PublicThemeMode,
} from '@/app/shared/public-site/use-public-theme';
import {
  buildCheckoutPath,
  findSabyPlan,
  type SabyBillingCurrency,
  type SabyBillingPeriod,
  type SabyPlanTier,
} from './saby-pricing-plans';

type PageState = 'loading' | 'loaded' | 'error';

type BillingProfile = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

type SubscriptionData = {
  id?: string;
  planId?: SabyPlanTier;
  planName?: string | null;
  status?: string | null;
  billingPeriod?: SabyBillingPeriod | string | null;
  currency?: SabyBillingCurrency | string | null;
  addOns?: Array<{ id?: string | null; name?: string | null }>;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  renewalAt?: string | null;
  pricingSnapshot?: Record<string, any>;
  metadata?: Record<string, any>;
};

type PaymentRecord = {
  id?: string;
  _id?: string;
  reference?: string;
  status?: string;
  amount?: number;
  total?: number;
  currency?: string;
  paymentMethod?: string;
  providerRef?: string;
  paymentDate?: string;
  completedAt?: string;
  createdAt?: string;
  paymentDetails?: Record<string, any>;
  metadata?: Record<string, any>;
};

const statusStyles: Record<string, { light: string; dark: string }> = {
  active: {
    light: 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]',
    dark: 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]',
  },
  trialing: {
    light: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
    dark: 'border-[#3b82f6]/45 bg-[#12233f] text-[#93c5fd]',
  },
  pending: {
    light: 'border-[#fdecc8] bg-[#fffbe6] text-[#a16207]',
    dark: 'border-[#f59e0b]/45 bg-[#3a2a12] text-[#facc15]',
  },
  paused: {
    light: 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]',
    dark: 'border-[#fb923c]/45 bg-[#3a2012] text-[#fdba74]',
  },
  past_due: {
    light: 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]',
    dark: 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]',
  },
  cancelled: {
    light: 'border-[#d7dfed] bg-[#f1f5f9] text-[#475569]',
    dark: 'border-white/15 bg-white/[0.05] text-white/65',
  },
  expired: {
    light: 'border-[#d7dfed] bg-[#f1f5f9] text-[#475569]',
    dark: 'border-white/15 bg-white/[0.05] text-white/65',
  },
  failed: {
    light: 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]',
    dark: 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]',
  },
  completed: {
    light: 'border-[#b6e2a5] bg-[#eaf9e2] text-[#3d7a2e]',
    dark: 'border-[#2f7d4c]/70 bg-[#123522] text-[#8ee6af]',
  },
  processing: {
    light: 'border-[#fdecc8] bg-[#fffbe6] text-[#a16207]',
    dark: 'border-[#f59e0b]/45 bg-[#3a2a12] text-[#facc15]',
  },
};

const titleCase = (value?: string | null) =>
  String(value || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getPaymentMethodLabel = (value?: string | null) => {
  const normalized = String(value || '').trim().toLowerCase();
  const labels: Record<string, string> = {
    paystack: 'Paystack',
    flutterwave: 'Flutterwave',
    full_credit: 'Full credit checkout',
    manual: 'Manual checkout',
    credit_card: 'Credit card',
    debit_card: 'Debit card',
    bank_transfer: 'Bank transfer',
    '9psb': '9PSB',
    sabypay: 'SabyPay',
    premium: 'Premium',
    trialling: 'Trial',
    paypal: 'PayPal',
    crypto: 'Crypto',
  };
  return labels[normalized] || titleCase(value);
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMoney = (amount?: number | null, currency?: string | null) => {
  const normalizedCurrency = String(currency || 'NGN').toUpperCase();
  const value = Number(amount || 0);
  return `${normalizedCurrency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getPaymentId = (payment: PaymentRecord) =>
  String(payment.id || payment._id || '');

const getPaymentDate = (payment: PaymentRecord) =>
  payment.completedAt || payment.paymentDate || payment.createdAt || null;

const receiptEligibleStatuses = new Set(['completed', 'refunded']);
const isReceiptPayment = (payment?: PaymentRecord | null) =>
  receiptEligibleStatuses.has(String(payment?.status || '').toLowerCase());

const getPaymentProviderLogo = (
  method?: string | null,
  isLightTheme?: boolean
) => {
  const normalized = String(method || '').trim().toLowerCase();
  if (normalized.includes('flutterwave')) {
    return isLightTheme
      ? '/Flutterwave/Flutterwave_on_black.svg'
      : '/Flutterwave/Flutterwave_on_white.svg';
  }
  if (normalized.includes('paystack')) {
    return isLightTheme
      ? '/Paystack/paystack_onblack.svg'
      : '/Paystack/paystack_onwhite.png';
  }
  return null;
};

function PaymentMethodIcon({
  method,
  isLightTheme,
  className = 'h-8 w-8 rounded-lg',
}: {
  method?: string | null;
  isLightTheme: boolean;
  className?: string;
}) {
  const logo = getPaymentProviderLogo(method, isLightTheme);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border shadow-sm ${
        isLightTheme
          ? 'border-[#e4e9f2] bg-white text-[#111827]'
          : 'border-white/10 bg-[#151c2b] text-white'
      } ${className}`}
    >
      {logo ? (
        <Image
          src={logo}
          alt={`${getPaymentMethodLabel(method)} logo`}
          width={46}
          height={18}
          className="max-h-[14px] w-auto object-contain"
        />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
    </span>
  );
}

const getRetryCheckoutHref = (
  payment?: PaymentRecord | null,
  fallbackSubscription?: SubscriptionData | null
) => {
  const metadata = payment?.metadata || {};
  const rawAddOns = Array.isArray(metadata.addOns)
    ? metadata.addOns
    : Array.isArray(fallbackSubscription?.addOns)
      ? fallbackSubscription?.addOns
      : [];
  const addOns = rawAddOns
    .map((addon: any) =>
      typeof addon === 'string' ? addon : String(addon?.id || '').trim()
    )
    .filter(Boolean);
  const plan = String(
    metadata.planId || fallbackSubscription?.planId || 'starter'
  ).trim();
  const period =
    String(metadata.billingPeriod || fallbackSubscription?.billingPeriod || '')
      .trim()
      .toLowerCase() === 'annual'
      ? 'annual'
      : 'monthly';
  const currency = String(
    payment?.currency ||
      metadata.currency ||
      fallbackSubscription?.currency ||
      'NGN'
  ).toUpperCase();
  const provider =
    String(payment?.paymentMethod || '')
      .trim()
      .toLowerCase() === 'flutterwave'
      ? 'flutterwave'
      : 'paystack';
  const params = new URLSearchParams({
    source: 'billing',
    plan,
    period,
    currency,
    provider,
  });
  if (addOns.length > 0) {
    params.set('addOns', addOns.join(','));
  }
  if (metadata.promoCode || metadata.code) {
    params.set('code', String(metadata.code || metadata.promoCode));
  }
  if (payment?.reference) {
    params.set('retry_reference', payment.reference);
  }
  return `/checkout?${params.toString()}`;
};

const downloadBlob = async (url: string, fallbackFileName: string) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || 'Download failed');
  }
  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] || fallbackFileName;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

function StatusBadge({
  status,
  isLightTheme,
}: {
  status?: string | null;
  isLightTheme: boolean;
}) {
  const normalized = String(status || 'unknown').toLowerCase();
  const style = statusStyles[normalized] || statusStyles.cancelled;
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
        isLightTheme ? style.light : style.dark
      }`}
    >
      {titleCase(normalized)}
    </span>
  );
}

function SectionCard({
  title,
  children,
  action,
  isLightTheme,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  isLightTheme: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-4 shadow-[0_10px_32px_rgba(15,23,42,0.05)] ${
        isLightTheme
          ? 'border-[#e2e8f0] bg-white'
          : 'border-white/10 bg-white/[0.05] shadow-[0_24px_70px_rgba(0,0,0,0.25)]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          className={`text-[0.78rem] font-bold uppercase tracking-[0.18em] ${
            isLightTheme ? 'text-[#475569]' : 'text-white/55'
          }`}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BillingSkeleton({ isLightTheme }: { isLightTheme: boolean }) {
  return (
    <div
      className={`grid min-h-screen lg:grid-cols-[36%_64%] ${
        isLightTheme ? 'bg-[#f3f6fb]' : 'bg-[#10141d]'
      }`}
    >
      <div className="hidden bg-black p-10 lg:block">
        <div className="h-5 w-40 animate-pulse rounded bg-white/20" />
        <div className="mt-24 h-24 w-72 animate-pulse rounded bg-white/10" />
      </div>
      <div className="space-y-4 px-5 py-8 sm:px-8 lg:px-10">
        {[132, 190, 120, 120].map((height) => (
          <div
            key={height}
            className={`animate-pulse rounded-2xl border ${
              isLightTheme
                ? 'border-[#e2e8f0] bg-white'
                : 'border-white/10 bg-white/[0.05]'
            }`}
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SabyBillingPage({
  initialTheme = 'dark',
}: {
  initialTheme?: PublicThemeMode;
}) {
  const { status: authStatus } = useSession();
  const { isLightTheme, toggleTheme } = usePublicTheme(initialTheme, {
    storageKey: 'saby:theme-preference:public-pages',
  });
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'ai-tokens' ? 'ai-tokens' : 'subscription';
  const [activeTab, setActiveTab] = useState<'subscription' | 'ai-tokens'>(initialTab);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(
    null
  );
  const [invoices, setInvoices] = useState<PaymentRecord[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecord | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBilling = useCallback(async () => {
    setPageState('loading');
    setErrorMessage(null);
    try {
      const [currentRes, invoicesRes] = await Promise.all([
        fetch('/api/subscriptions/current', { cache: 'no-store' }),
        fetch('/api/subscriptions/invoices?limit=10&page=1', {
          cache: 'no-store',
        }),
      ]);

      const currentData = (await currentRes.json().catch(() => ({}))) as {
        subscription?: SubscriptionData | null;
        billingProfile?: BillingProfile | null;
        message?: string;
      };
      if (!currentRes.ok) {
        throw new Error(currentData.message || 'Failed to load subscription');
      }
      setSubscription(currentData.subscription || null);
      setBillingProfile(currentData.billingProfile || null);

      const invoiceData = (await invoicesRes.json().catch(() => ({}))) as {
        results?: PaymentRecord[];
        invoices?: PaymentRecord[];
        data?: PaymentRecord[];
      };
      if (invoicesRes.ok) {
        const rows =
          invoiceData.results || invoiceData.invoices || invoiceData.data || [];
        setInvoices(Array.isArray(rows) ? rows : []);
      }
      setPageState('loaded');
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to load billing');
      setPageState('error');
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      setPageState('loaded');
      setIsAuthModalOpen(true);
      return;
    }
    if (authStatus === 'authenticated') {
      void fetchBilling();
    }
  }, [authStatus, fetchBilling]);

  const plan = useMemo(
    () => findSabyPlan(subscription?.planId || 'starter'),
    [subscription?.planId]
  );
  const currency = String(subscription?.currency || 'NGN').toUpperCase();
  const billingPeriod =
    String(subscription?.billingPeriod || 'monthly').toLowerCase() === 'annual'
      ? 'annual'
      : 'monthly';
  const currentAmount =
    Number(subscription?.pricingSnapshot?.total) ||
    Number(subscription?.pricingSnapshot?.amount) ||
    0;
  const periodEnd =
    subscription?.currentPeriodEnd || subscription?.renewalAt || null;
  const cancelAtPeriodEnd = subscription?.metadata?.cancelAtPeriodEnd === true;
  const accessUntil = subscription?.metadata?.accessUntil || periodEnd;
  const upgradeHref = buildCheckoutPath({
    plan: subscription?.planId || 'starter',
    period: billingPeriod as SabyBillingPeriod,
    currency: currency === 'USD' ? 'USD' : 'NGN',
    addOns: (subscription?.addOns || [])
      .map((addon) => String(addon.id || ''))
      .filter(Boolean) as any,
  });
  const latestPayment = invoices[0] || null;
  const billingAddress = [
    billingProfile?.address,
    billingProfile?.city,
    billingProfile?.state,
    billingProfile?.country,
  ]
    .filter(Boolean)
    .join(', ');

  const handleCancelPlan = async () => {
    if (!subscription || cancelAtPeriodEnd) return;
    const confirmed = window.confirm(
      "Cancel this plan at the end of the billing period? You'll keep access until the end date."
    );
    if (!confirmed) return;
    setIsCancelling(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/subscriptions/current/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'tenant-request' }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        subscription?: SubscriptionData;
      };
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to cancel subscription');
      }
      setSubscription(data.subscription || subscription);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = async (invoice: PaymentRecord) => {
    const paymentId = getPaymentId(invoice);
    const reference = invoice.reference || '';
    if (!paymentId && !reference) return;
    setDownloadingId(paymentId || reference);
    setErrorMessage(null);
    try {
      await downloadBlob(
        paymentId
          ? `/api/subscriptions/invoices/${encodeURIComponent(paymentId)}/receipt`
          : `/api/subscriptions/invoices/reference/${encodeURIComponent(reference)}/receipt`,
        `saby-receipt-${reference || paymentId}.pdf`
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadInvoice = async (invoice: PaymentRecord) => {
    const paymentId = getPaymentId(invoice);
    const reference = invoice.reference || '';
    if (!paymentId && !reference) return;
    setDownloadingId(`invoice:${paymentId || reference}`);
    setErrorMessage(null);
    try {
      await downloadBlob(
        paymentId
          ? `/api/subscriptions/invoices/${encodeURIComponent(paymentId)}/invoice`
          : `/api/subscriptions/invoices/reference/${encodeURIComponent(reference)}/invoice`,
        `saby-invoice-${reference || paymentId}.pdf`
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadBillingDocument = async (invoice: PaymentRecord) => {
    const paymentId = getPaymentId(invoice);
    const reference = invoice.reference || '';
    if (!paymentId && !reference) return;
    const isReceipt = isReceiptPayment(invoice);
    setDownloadingId(`billing:${paymentId || reference}`);
    setErrorMessage(null);
    try {
      await downloadBlob(
        paymentId
          ? `/api/subscriptions/invoices/${encodeURIComponent(paymentId)}/billing-document`
          : `/api/subscriptions/invoices/reference/${encodeURIComponent(reference)}/billing-document`,
        `saby-${isReceipt ? 'receipt' : 'invoice'}-${reference || paymentId}.pdf`
      );
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          `Failed to download ${isReceipt ? 'receipt' : 'invoice'}`
      );
    } finally {
      setDownloadingId(null);
    }
  };

  if (authStatus === 'loading' || pageState === 'loading') {
    return (
      <main
        className={`min-h-screen ${
          isLightTheme ? 'bg-[#f3f6fb]' : 'bg-[#10141d]'
        }`}
      >
        <BillingSkeleton isLightTheme={isLightTheme} />
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen ${
        isLightTheme ? 'bg-[#f3f6fb] text-[#111827]' : 'bg-[#10141d] text-white'
      }`}
    >
      <div className="grid min-h-screen lg:grid-cols-[36%_64%]">
        <aside className="relative hidden min-h-screen bg-black px-8 py-9 text-white lg:block xl:px-10">
          <div className="flex items-center gap-3">
            <span className="flex h-5 w-6 items-center justify-center rounded-[4px] bg-white">
              <span className="block h-3 w-4 rounded-[2px] bg-[#6477ff]" />
            </span>
            <span className="text-[0.78rem] font-bold uppercase tracking-[0.32em]">
              Saby Billing
            </span>
          </div>

          <div className="mt-24 max-w-[310px]">
            <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-white/90">
              Manage your Saby billing settings
            </h1>
            <Link
              href="/studio"
              className="mt-10 inline-flex items-center gap-3 text-sm font-medium text-white/75 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Saby AI
            </Link>
          </div>

          <div className="absolute bottom-10 left-8 space-y-2 text-xs text-white/45 xl:left-10">
            <p>Powered by Saby Billing</p>
            <p>Secure hosted checkout</p>
            <p>Terms&nbsp;&nbsp; Privacy</p>
          </div>
        </aside>

        <section
          className={`min-h-screen overflow-y-auto px-4 py-6 sm:px-8 lg:px-9 lg:py-8 xl:px-12 ${
            isLightTheme ? 'bg-[#f3f6fb]' : 'bg-[#10141d]'
          }`}
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4 lg:hidden">
            <div>
              <div
                className={`flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.22em] ${
                  isLightTheme ? 'text-[#475569]' : 'text-white/65'
                }`}
              >
                <span
                  className={`flex h-5 w-6 items-center justify-center rounded-[4px] ${
                    isLightTheme ? 'bg-[#111827]' : 'bg-white'
                  }`}
                >
                  <span className="block h-3 w-4 rounded-[2px] bg-[#6477ff]" />
                </span>
                Saby Billing
              </div>
              <Link
                href="/studio"
                className={`mt-3 inline-flex items-center gap-2 text-xs font-semibold transition ${
                  isLightTheme
                    ? 'text-[#64748b] hover:text-[#111827]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to workspace
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <PublicThemeToggleButton
                mode={isLightTheme ? 'light' : 'dark'}
                onChange={toggleTheme}
                className="h-9 w-9"
              />
            </div>
          </div>

          <div className="mx-auto max-w-[880px]">
            <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
              <div>
                <p
                  className={`text-[0.76rem] font-bold uppercase tracking-[0.18em] ${
                    isLightTheme ? 'text-[#64748b]' : 'text-white/65'
                  }`}
                >
                  Billing console
                </p>
                <p
                  className={`mt-1 text-xs ${
                    isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'
                  }`}
                >
                  Subscription, invoices, billing information, and payment
                  records.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PublicThemeToggleButton
                  mode={isLightTheme ? 'light' : 'dark'}
                  onChange={toggleTheme}
                  className="h-9 w-9"
                />
              </div>
            </div>
            {errorMessage ? (
              <div
                className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                  isLightTheme
                    ? 'border-[#f3c0c8] bg-[#fdecef] text-[#be485f]'
                    : 'border-[#fb7185]/45 bg-[#3a1720] text-[#fda4af]'
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto font-semibold"
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {/* ── Billing Console Tab Switcher ── */}
            <div className="mb-6 flex items-center gap-2 border-b pb-3 border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'subscription'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLightTheme
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                Workspace Subscription
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai-tokens')}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === 'ai-tokens'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isLightTheme
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Tokens & Copilot
              </button>
            </div>

            {activeTab === 'ai-tokens' ? (
              <SabyAiTokensSection isLightTheme={isLightTheme} />
            ) : (
              <>
                {!subscription ? (
              <SectionCard
                title="Current Subscription"
                isLightTheme={isLightTheme}
              >
                <div
                  className={`rounded-2xl border border-dashed p-8 text-center ${
                    isLightTheme
                      ? 'border-[#d7dfed] bg-[#f8fafc]'
                      : 'border-white/15 bg-white/[0.04]'
                  }`}
                >
                  <p
                    className={`text-lg font-semibold ${
                      isLightTheme ? 'text-[#111827]' : 'text-white'
                    }`}
                  >
                    No active subscription
                  </p>
                  <p
                    className={`mt-2 text-sm ${
                      isLightTheme ? 'text-[#64748b]' : 'text-white/60'
                    }`}
                  >
                    Choose a plan to activate workspace billing.
                  </p>
                  <Link
                    href="/pricing"
                    className={`mt-5 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold ${
                      isLightTheme
                        ? 'bg-[#111827] text-white'
                        : 'bg-white text-[#111827]'
                    }`}
                  >
                    Choose a plan
                  </Link>
                </div>
              </SectionCard>
            ) : (
              <div className="grid gap-4">
                <SectionCard
                  title="Current Subscription"
                  isLightTheme={isLightTheme}
                  action={
                    <Link
                      href={upgradeHref}
                      className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold ${
                        isLightTheme
                          ? 'bg-[#111827] text-white'
                          : 'bg-white text-[#111827]'
                      }`}
                    >
                      Upgrade
                    </Link>
                  }
                >
                  <div className="grid gap-4 xl:grid-cols-[1fr_220px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-lg font-semibold ${
                            isLightTheme ? 'text-[#0f172a]' : 'text-white'
                          }`}
                        >
                          {plan?.name || subscription.planName || 'Starter'}{' '}
                          plan
                        </h3>
                        <StatusBadge
                          status={subscription.status}
                          isLightTheme={isLightTheme}
                        />
                        {cancelAtPeriodEnd ? (
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                              isLightTheme
                                ? 'border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]'
                                : 'border-[#fb923c]/45 bg-[#3a2012] text-[#fdba74]'
                            }`}
                          >
                            Cancels on {formatDate(accessUntil)}
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`mt-2 text-[1.75rem] font-semibold leading-none ${
                          isLightTheme ? 'text-[#111827]' : 'text-white'
                        }`}
                      >
                        {formatMoney(currentAmount, currency)}
                        <span
                          className={`ml-2 text-xs font-medium ${
                            isLightTheme ? 'text-[#64748b]' : 'text-white/55'
                          }`}
                        >
                          / {billingPeriod === 'annual' ? 'year' : 'month'}
                        </span>
                      </p>
                      <div
                        className={`mt-3 flex flex-wrap gap-2 text-xs ${
                          isLightTheme ? 'text-[#64748b]' : 'text-white/55'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Renews {formatDate(periodEnd)}
                        </span>
                        <span>{titleCase(billingPeriod)} billing</span>
                        <span>{currency}</span>
                      </div>
                    </div>
                    <div
                      className={`rounded-xl p-3 ${
                        isLightTheme ? 'bg-[#f8fafc]' : 'bg-white/[0.04]'
                      }`}
                    >
                      <p
                        className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
                          isLightTheme ? 'text-[#64748b]' : 'text-white/45'
                        }`}
                      >
                        Included add-ons
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {(subscription.addOns || []).length ? (
                          subscription.addOns?.map((addon) => (
                            <div
                              key={addon.id || addon.name}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                                isLightTheme
                                  ? 'border-[#e4e9f2] bg-white text-[#334155]'
                                  : 'border-white/10 bg-[#151c2b] text-white/80'
                              }`}
                            >
                              {addon.name || addon.id}
                            </div>
                          ))
                        ) : (
                          <p
                            className={`text-xs ${
                              isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'
                            }`}
                          >
                            No add-ons on this plan.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Billing History" isLightTheme={isLightTheme}>
                  {invoices.length === 0 ? (
                    <div
                      className={`rounded-xl border border-dashed p-5 text-center text-xs ${
                        isLightTheme
                          ? 'border-[#d7dfed] bg-[#f8fafc] text-[#64748b]'
                          : 'border-white/15 bg-white/[0.04] text-white/55'
                      }`}
                    >
                      No billing history yet.
                    </div>
                  ) : (
                    <div
                      className={`overflow-x-auto rounded-xl border ${
                        isLightTheme ? 'border-[#e4e9f2]' : 'border-white/10'
                      }`}
                    >
                      <table className="w-full min-w-[620px] text-left text-xs">
                        <thead
                          className={`text-[0.65rem] uppercase tracking-[0.12em] ${
                            isLightTheme
                              ? 'bg-[#f8fafc] text-[#64748b]'
                              : 'bg-white/[0.04] text-white/45'
                          }`}
                        >
                          <tr>
                            <th className="px-3 py-2.5">Date</th>
                            <th className="px-3 py-2.5">Amount</th>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Method</th>
                            <th className="px-3 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isLightTheme
                              ? 'divide-[#e4e9f2] bg-white'
                              : 'divide-white/10 bg-[#111827]/40'
                          }`}
                        >
                          {invoices.map((invoice) => {
                            const paymentId = getPaymentId(invoice);
                            const paymentKey =
                              paymentId || invoice.reference || '';
                            const receiptEligible = isReceiptPayment(invoice);
                            const documentLabel = receiptEligible
                              ? 'Receipt'
                              : 'Invoice';
                            const billingDownloadKey = `billing:${paymentKey}`;
                            const retryCheckoutHref = getRetryCheckoutHref(
                              invoice,
                              subscription
                            );
                            return (
                              <tr key={paymentId || invoice.reference}>
                                <td
                                  className={`px-3 py-2.5 ${
                                    isLightTheme
                                      ? 'text-[#475569]'
                                      : 'text-white/65'
                                  }`}
                                >
                                  {formatDate(getPaymentDate(invoice))}
                                </td>
                                <td
                                  className={`px-3 py-2.5 font-semibold ${
                                    isLightTheme ? 'text-[#111827]' : 'text-white'
                                  }`}
                                >
                                  {formatMoney(
                                    invoice.total ?? invoice.amount,
                                    invoice.currency
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <StatusBadge
                                    status={invoice.status}
                                    isLightTheme={isLightTheme}
                                  />
                                </td>
                                <td
                                  className={`px-3 py-2.5 ${
                                    isLightTheme
                                      ? 'text-[#475569]'
                                      : 'text-white/65'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    <PaymentMethodIcon
                                      method={invoice.paymentMethod}
                                      isLightTheme={isLightTheme}
                                      className="h-7 w-7 rounded-md"
                                    />
                                    <span>{getPaymentMethodLabel(invoice.paymentMethod)}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedInvoice(invoice)
                                      }
                                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                                        isLightTheme
                                          ? 'border-[#d7dfed] text-[#475569] hover:bg-[#f8fafc]'
                                          : 'border-white/15 text-white/70 hover:bg-white/[0.06]'
                                      }`}
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDownloadBillingDocument(invoice)
                                      }
                                      disabled={
                                        !paymentKey ||
                                        downloadingId === billingDownloadKey
                                      }
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold disabled:opacity-50 ${
                                        isLightTheme
                                          ? 'bg-[#111827] text-white'
                                          : 'bg-white text-[#111827]'
                                      }`}
                                    >
                                      {downloadingId === billingDownloadKey ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Download className="h-3 w-3" />
                                      )}
                                      {documentLabel}
                                    </button>
                                    {!receiptEligible ? (
                                      <Link
                                        href={retryCheckoutHref}
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                                          isLightTheme
                                            ? 'border-[#111827] text-[#111827] hover:bg-[#f8fafc]'
                                            : 'border-white/20 text-white/75 hover:bg-white/[0.06]'
                                        }`}
                                      >
                                        <RotateCcw className="h-3 w-3" />
                                        Retry
                                      </Link>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>

                <div className="grid gap-4 xl:grid-cols-2">
                  <SectionCard
                    title="Billing Information"
                    isLightTheme={isLightTheme}
                  >
                    <div className="space-y-3 text-xs">
                      <div>
                        <p
                          className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
                            isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'
                          }`}
                        >
                          Billing name
                        </p>
                        <p
                          className={`mt-1 font-medium ${
                            isLightTheme ? 'text-[#111827]' : 'text-white'
                          }`}
                        >
                          {billingProfile?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
                            isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'
                          }`}
                        >
                          Email
                        </p>
                        <p
                          className={`mt-1 font-medium ${
                            isLightTheme ? 'text-[#111827]' : 'text-white'
                          }`}
                        >
                          {billingProfile?.email || '-'}
                        </p>
                      </div>
                      <div>
                        <p
                          className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
                            isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'
                          }`}
                        >
                          Address
                        </p>
                        <p
                          className={`mt-1 font-medium ${
                            isLightTheme ? 'text-[#111827]' : 'text-white'
                          }`}
                        >
                          {billingAddress || '-'}
                        </p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Payment Method"
                    isLightTheme={isLightTheme}
                  >
                    <div
                      className={`rounded-xl border p-3 ${
                        isLightTheme
                          ? 'border-[#e4e9f2] bg-[#f8fafc]'
                          : 'border-white/10 bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <PaymentMethodIcon
                          method={latestPayment?.paymentMethod}
                          isLightTheme={isLightTheme}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold ${
                              isLightTheme ? 'text-[#111827]' : 'text-white'
                            }`}
                          >
                            {latestPayment
                              ? getPaymentMethodLabel(latestPayment.paymentMethod)
                              : 'No payment method yet'}
                          </p>
                          <p
                            className={`mt-1 break-words text-xs ${
                              isLightTheme ? 'text-[#64748b]' : 'text-white/55'
                            }`}
                          >
                            {latestPayment
                              ? String(latestPayment.paymentMethod || '').toLowerCase() === 'full_credit'
                                ? 'This subscription was covered by credit or promotional value. No provider was charged.'
                                : 'Payments are completed through secure hosted checkout.'
                              : 'No card stored by Saby. Payments are completed through hosted checkout.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                <section
                  className={`rounded-2xl border p-4 ${
                    isLightTheme
                      ? 'border-[#fed7aa] bg-[#fff7ed]'
                      : 'border-[#fb923c]/35 bg-[#3a2012]/70'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2
                        className={`text-sm font-semibold ${
                          isLightTheme ? 'text-[#9a3412]' : 'text-[#fdba74]'
                        }`}
                      >
                        Cancel plan
                      </h2>
                      <p
                        className={`mt-1 max-w-2xl text-xs ${
                          isLightTheme ? 'text-[#9a3412]' : 'text-[#fed7aa]'
                        }`}
                      >
                        If you cancel, you&apos;ll keep full access to your plan
                        features until the end of your billing period.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelPlan}
                      disabled={isCancelling || cancelAtPeriodEnd}
                      className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isLightTheme
                          ? 'border-[#fdba74] bg-white text-[#9a3412] hover:bg-[#ffedd5]'
                          : 'border-[#fb923c]/45 bg-[#151c2b] text-[#fdba74] hover:bg-[#1d2738]'
                      }`}
                    >
                      {isCancelling ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {cancelAtPeriodEnd
                        ? `Cancels ${formatDate(accessUntil)}`
                        : 'Cancel plan'}
                    </button>
                  </div>
                </section>
              </div>
            )}
              </>
            )}
          </div>
        </section>
      </div>

      {selectedInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div
            className={`w-full max-w-[720px] rounded-[26px] border p-6 shadow-[0_30px_90px_rgba(0,0,0,0.25)] ${
              isLightTheme
                ? 'border-transparent bg-white'
                : 'border-white/10 bg-[#151c2b] text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isReceiptPayment(selectedInvoice)
                      ? isLightTheme
                        ? 'bg-[#ecfdf5] text-[#059669]'
                        : 'bg-[#123522] text-[#8ee6af]'
                      : isLightTheme
                        ? 'bg-[#fff7ed] text-[#c2410c]'
                        : 'bg-[#3a2012] text-[#fdba74]'
                  }`}
                >
                  {isReceiptPayment(selectedInvoice) ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isLightTheme ? 'text-[#64748b]' : 'text-white/55'
                    }`}
                  >
                    {isReceiptPayment(selectedInvoice)
                      ? 'Invoice paid'
                      : 'Invoice due'}
                  </p>
                  <h3
                    className={`text-2xl font-semibold ${
                      isLightTheme ? 'text-[#111827]' : 'text-white'
                    }`}
                  >
                    {formatMoney(
                      selectedInvoice.total || selectedInvoice.amount,
                      selectedInvoice.currency
                    )}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className={`rounded-xl border p-2 ${
                  isLightTheme
                    ? 'border-[#e4e9f2] text-[#64748b] hover:bg-[#f8fafc]'
                    : 'border-white/10 text-white/60 hover:bg-white/[0.06]'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
              <div
                className={`rounded-2xl p-4 ${
                  isLightTheme ? 'bg-[#f8fafc]' : 'bg-white/[0.04]'
                }`}
              >
                <p className={isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'}>
                  Invoice number
                </p>
                <p
                  className={`mt-1 font-semibold ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  {selectedInvoice.reference || getPaymentId(selectedInvoice)}
                </p>
              </div>
              <div
                className={`rounded-2xl p-4 ${
                  isLightTheme ? 'bg-[#f8fafc]' : 'bg-white/[0.04]'
                }`}
              >
                <p className={isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'}>
                  Payment date
                </p>
                <p
                  className={`mt-1 font-semibold ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  {formatDate(getPaymentDate(selectedInvoice))}
                </p>
              </div>
              <div
                className={`rounded-2xl p-4 ${
                  isLightTheme ? 'bg-[#f8fafc]' : 'bg-white/[0.04]'
                }`}
              >
                <p className={isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'}>
                  Payment method
                </p>
                <p
                  className={`mt-1 font-semibold ${
                    isLightTheme ? 'text-[#111827]' : 'text-white'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <PaymentMethodIcon
                      method={selectedInvoice.paymentMethod}
                      isLightTheme={isLightTheme}
                      className="h-8 w-8 rounded-lg"
                    />
                    <span>{getPaymentMethodLabel(selectedInvoice.paymentMethod)}</span>
                  </span>
                </p>
              </div>
              <div
                className={`rounded-2xl p-4 ${
                  isLightTheme ? 'bg-[#f8fafc]' : 'bg-white/[0.04]'
                }`}
              >
                <p className={isLightTheme ? 'text-[#94a3b8]' : 'text-white/45'}>
                  Status
                </p>
                <div className="mt-1">
                  <StatusBadge
                    status={selectedInvoice.status}
                    isLightTheme={isLightTheme}
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleDownloadInvoice(selectedInvoice)}
                className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold ${
                  isLightTheme
                    ? 'border-[#111827] bg-white text-[#111827]'
                    : 'border-white/15 bg-transparent text-white/75'
                }`}
              >
                <FileText className="h-4 w-4" />
                Download invoice
              </button>
              {isReceiptPayment(selectedInvoice) ? (
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(selectedInvoice)}
                  className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold ${
                    isLightTheme
                      ? 'bg-[#111827] text-white'
                      : 'bg-white text-[#111827]'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  Download receipt
                </button>
              ) : (
                <Link
                  href={getRetryCheckoutHref(selectedInvoice, subscription)}
                  className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold ${
                    isLightTheme
                      ? 'bg-[#111827] text-white'
                      : 'bg-white text-[#111827]'
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Pay invoice
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <PublicAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackPath="/billing"
        isLightTheme={isLightTheme}
        description="Sign in to manage your subscription and invoices."
      />
    </main>
  );
}
