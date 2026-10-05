'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Bot,
  Coins,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TokenBalance = {
  tenantId?: string;
  isSaby?: boolean;
  purchasedTokens?: number;
  usedTokens?: number;
  remainingTokens?: number;
  isUnlimited?: boolean;
  lastPurchaseAt?: string | null;
};

type TokenPack = {
  id: string;
  name: string;
  tokens: number;
  pricing: { USD: number; NGN: number };
  description: string;
  popular?: boolean;
};

export default function SabyAiTokensSection({
  isLightTheme = false,
}: {
  isLightTheme?: boolean;
}) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [error, setError] = useState<string | null>(null);

  const packs: TokenPack[] = [
    {
      id: 'starter',
      name: 'Starter AI Pack',
      tokens: 500000,
      pricing: { USD: 10, NGN: 15000 },
      description: '500,000 tokens — ideal for ~250–500 operational workflows',
      popular: false,
    },
    {
      id: 'growth',
      name: 'Growth AI Pack',
      tokens: 1500000,
      pricing: { USD: 25, NGN: 37500 },
      description: '1,500,000 tokens — ideal for ~750–1,500 operational workflows',
      popular: true,
    },
    {
      id: 'power',
      name: 'Power AI Pack',
      tokens: 3500000,
      pricing: { USD: 50, NGN: 75000 },
      description: '3,500,000 tokens — ideal for ~1,750–3,500 operational workflows',
      popular: false,
    },
  ];

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai-tokens/balance', { cache: 'no-store' });
      if (res.ok) {
        const json: any = await res.json();
        setBalance(json.data || json);
      } else {
        const errJson: any = await res.json().catch(() => ({}));
        setError(errJson?.message || 'Failed to load AI token balance');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleBuyPack = async (pack: TokenPack) => {
    try {
      setPurchasingPackId(pack.id);
      const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/billing?tab=ai-tokens&status=success` : '';
      const res = await fetch('/api/ai-tokens/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          currency,
          provider: 'flutterwave',
          returnUrl,
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to initialize checkout');
      }

      const redirectUrl =
        data.data?.checkout?.authorizationUrl ||
        data.data?.checkout?.checkoutUrl ||
        data.data?.checkout?.link ||
        data.checkout?.authorizationUrl;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error('Payment checkout URL could not be generated. Please try again.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Checkout initialization failed');
    } finally {
      setPurchasingPackId(null);
    }
  };

  const isUnlimited = Boolean(balance?.isSaby || balance?.isUnlimited);
  const remaining = balance?.remainingTokens || 0;
  const used = balance?.usedTokens || 0;
  const purchased = balance?.purchasedTokens || 0;
  const isDepleted = !isUnlimited && remaining <= 0;

  return (
    <div className="space-y-6">
      {/* ── Top Balance Widget ── */}
      <div
        className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm transition-all sm:p-8 ${
          isLightTheme
            ? 'border-[#e2e8f0] bg-white text-[#0f172a]'
            : 'border-white/10 bg-gradient-to-br from-[#131926] via-[#10141d] to-[#0c0f17] text-white'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#3b82f6] to-[#8b5cf6] text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">Saby Copilot AI Tokens</h3>
                {isUnlimited ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400">
                    <ShieldCheck className="h-3 w-3" />
                    Unlimited (isSaby)
                  </span>
                ) : isDepleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                    <AlertTriangle className="h-3 w-3" />
                    Depleted — Top Up Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Active Balance
                  </span>
                )}
              </div>
              <p className={`mt-0.5 text-xs ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                Compute tokens powering multi-model operations, reporting, and automated actions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBalance}
              disabled={loading}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isLightTheme
                  ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Refresh Balance'}
            </button>
          </div>
        </div>

        {/* ── Balance Stats Grid ── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className={`rounded-2xl border p-4 ${
              isLightTheme ? 'border-slate-100 bg-slate-50/70' : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <span className={`text-[0.7rem] font-bold uppercase tracking-wider ${isLightTheme ? 'text-slate-400' : 'text-slate-400'}`}>
              Available Tokens
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-indigo-500">
                {isUnlimited ? '∞' : remaining.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">tokens</span>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${
              isLightTheme ? 'border-slate-100 bg-slate-50/70' : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <span className={`text-[0.7rem] font-bold uppercase tracking-wider ${isLightTheme ? 'text-slate-400' : 'text-slate-400'}`}>
              Tokens Consumed
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight">
                {used.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">tokens</span>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${
              isLightTheme ? 'border-slate-100 bg-slate-50/70' : 'border-white/5 bg-white/[0.03]'
            }`}
          >
            <span className={`text-[0.7rem] font-bold uppercase tracking-wider ${isLightTheme ? 'text-slate-400' : 'text-slate-400'}`}>
              Lifetime Purchased
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight">
                {isUnlimited ? 'Unlimited' : purchased.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Model Support Pill List ── */}
        <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-dashed border-slate-200/50 dark:border-white/10">
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Supported Models:</span>
          {['OpenAI (GPT-4o, o3-mini)', 'Google Gemini (3.7 Flash)', 'DeepSeek (V3, R1)', 'Claude (3.7 Sonnet)'].map((m) => (
            <span
              key={m}
              className={`rounded-lg px-2.5 py-1 text-[0.7rem] font-medium ${
                isLightTheme ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-slate-300'
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* ── Token Pack Purchase Section ── */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold tracking-tight">Purchase AI Token Packages</h4>
            <p className={`text-xs ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
              Instant automated crediting via Flutterwave checkout. Tokens do not expire.
            </p>
          </div>

          {/* ── Currency Selector ── */}
          <div
            className={`inline-flex rounded-xl border p-0.5 ${
              isLightTheme ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-white/5'
            }`}
          >
            <button
              onClick={() => setCurrency('NGN')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                currency === 'NGN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isLightTheme
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NGN (₦)
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                currency === 'USD'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isLightTheme
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {packs.map((pack) => {
            const price = pack.pricing[currency];
            const isPurchasing = purchasingPackId === pack.id;

            return (
              <div
                key={pack.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                  pack.popular
                    ? isLightTheme
                      ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-50/50 to-white shadow-indigo-500/10'
                      : 'border-indigo-500/50 bg-gradient-to-b from-indigo-950/20 to-white/[0.02] shadow-indigo-500/10'
                    : isLightTheme
                    ? 'border-slate-200 bg-white shadow-sm'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {pack.popular ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-base">{pack.name}</h5>
                    <Coins className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{pack.description}</p>

                  <div className="my-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black tracking-tight">
                        {currency === 'NGN' ? '₦' : '$'}
                        {price.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400">one-time</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-indigo-500">
                      ⚡ {pack.tokens.toLocaleString()} tokens included
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyPack(pack)}
                  disabled={Boolean(purchasingPackId)}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold tracking-wide transition shadow-sm ${
                    pack.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-95'
                      : isLightTheme
                      ? 'bg-[#111827] text-white hover:bg-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting to Flutterwave...
                    </>
                  ) : (
                    <>
                      Buy with Flutterwave
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
