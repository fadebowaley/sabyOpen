export type SabyPlanTier = string;
export type SabyBillingPeriod = 'monthly' | 'annual';
export type SabyBillingCurrency = 'USD' | 'NGN';
export type SabyPricingAddonId = string;

export type SabyPricingAddon = {
  id: SabyPricingAddonId;
  name: string;
  description: string;
  category: 'capability';
  monthlyUsd: number;
  annualUsd: number;
  monthlyNgn: number;
  annualNgn: number;
  eligiblePlans: SabyPlanTier[];
};

export type SabyPricingPlan = {
  id: SabyPlanTier;
  name: string;
  description: string;
  monthlyUsd: number;
  annualUsd: number;
  monthlyNgn: number;
  annualNgn: number;
  monthlyPeriodLabel?: string;
  annualPeriodLabel?: string;
  subline: string;
  controlLabel: string;
  ctaLabel: string;
  featureHeading: string;
  features: string[];
  highlightCta?: boolean;
  popular?: boolean;
  note: string;
  contactSalesOnly?: boolean;
  includedQuotas?: {
    forms?: number | 'unlimited';
    nodes?: number | 'unlimited';
    seats?: number | 'unlimited';
    storageMb?: number | 'custom';
    submissionsPerMonth?: number | 'unlimited';
    apiRatePerHour?: number | 'custom';
    auditRetentionDays?: number | 'custom';
  };
  included?: {
    forms?: number | 'unlimited';
    nodes?: number | 'unlimited';
    seats?: number | 'unlimited';
    storageMb?: number | 'custom';
    submissionsPerMonth?: number | 'unlimited';
    apiRatePerHour?: number | 'custom';
    auditRetentionDays?: number | 'custom';
    reportFrequencies?: string[];
    channels?: string[];
    supportTier?: string;
  };
  includedCapabilities?: string[];
};

export type SabyPricingCatalog = {
  plans: SabyPricingPlan[] | Record<string, SabyPricingPlan>;
  addons: SabyPricingAddon[] | Record<string, SabyPricingAddon>;
  vatRate?: number;
  exchangeRates?: {
    usdToNgn?: number;
    source?: string;
    updatedAt?: string | null;
  };
  discounts?: {
    enabled?: boolean;
    mode?: 'percentage' | 'fixed' | string;
    value?: number;
    label?: string;
  };
  discountRules?: Array<{
    id?: string;
    code?: string;
    label: string;
    enabled?: boolean;
    mode?: 'percentage' | 'fixed' | string;
    value?: number;
    currency?: SabyBillingCurrency | null;
    startsAt?: string | null;
    expiresAt?: string | null;
  }>;
  credits?: {
    enabled?: boolean;
    amount?: number;
    label?: string;
  };
  creditRules?: Array<{
    id?: string;
    code?: string;
    label: string;
    enabled?: boolean;
    mode?: 'percentage' | 'fixed' | string;
    value?: number;
    currency?: SabyBillingCurrency | null;
    startsAt?: string | null;
    expiresAt?: string | null;
  }>;
  manualValidation?: {
    enabled?: boolean;
    note?: string;
  };
  promoCodes?: Array<{
    code: string;
    enabled?: boolean;
    mode?: 'percentage' | 'fixed' | string;
    value?: number;
    currency?: SabyBillingCurrency | null;
    startsAt?: string | null;
    expiresAt?: string | null;
    maxRedemptions?: number | null;
  }>;
  serviceFee?: {
    enabled?: boolean;
    rate?: number;
    flat?: number;
    min?: number;
    max?: number;
    freeBelow?: number;
  };
};

export const SABY_PRICING_ADDONS: SabyPricingAddon[] = [
  {
    id: 'payments_collection',
    name: 'Payment Collection',
    description: 'Enable Saby-managed payment collection, settlement, and payout routing.',
    category: 'capability',
    monthlyUsd: 35,
    annualUsd: 350,
    monthlyNgn: 38500,
    annualNgn: 385000,
    eligiblePlans: ['starter', 'pro', 'business'],
  },
  {
    id: 'workflows_approvals',
    name: 'Workflows & Approvals',
    description: 'Add approval flows and workflow orchestration to lower plans.',
    category: 'capability',
    monthlyUsd: 15,
    annualUsd: 150,
    monthlyNgn: 16500,
    annualNgn: 165000,
    eligiblePlans: ['starter', 'pro'],
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'Add API access for tenants that need machine-to-machine ingestion.',
    category: 'capability',
    monthlyUsd: 20,
    annualUsd: 200,
    monthlyNgn: 22000,
    annualNgn: 220000,
    eligiblePlans: ['starter'],
  },
];

const catalogPlansToArray = (
  catalog?: SabyPricingCatalog | null
): SabyPricingPlan[] => {
  const plans = catalog?.plans || DEFAULT_SABY_PRICING_CATALOG.plans;
  const rows = Array.isArray(plans) ? plans : Object.values(plans);
  return rows.map((plan: any) => ({
    ...plan,
    monthlyUsd: Number(plan.monthlyUsd ?? plan.pricing?.monthly?.USD ?? 0),
    annualUsd: Number(plan.annualUsd ?? plan.pricing?.annual?.USD ?? 0),
    monthlyNgn: Number(plan.monthlyNgn ?? plan.pricing?.monthly?.NGN ?? 0),
    annualNgn: Number(plan.annualNgn ?? plan.pricing?.annual?.NGN ?? 0),
    subline: plan.subline || plan.description || '',
    controlLabel: plan.controlLabel || '',
    ctaLabel: plan.ctaLabel || 'Select',
    featureHeading: plan.featureHeading || 'Included',
    features:
      Array.isArray(plan.features) && plan.features.length > 0
        ? plan.features
        : Array.isArray(plan.featureHighlights) && plan.featureHighlights.length > 0
          ? plan.featureHighlights
          : [],
    note: plan.note || plan.notes || '',
  }));
};

const catalogAddonsToArray = (
  catalog?: SabyPricingCatalog | null
): SabyPricingAddon[] => {
  const addons = catalog?.addons || DEFAULT_SABY_PRICING_CATALOG.addons;
  const rows = Array.isArray(addons) ? addons : Object.values(addons);
  return rows.map((addon: any) => ({
    ...addon,
    description: addon.description || addon.name || '',
    category: addon.category || 'capability',
    monthlyUsd: Number(addon.monthlyUsd ?? addon.pricing?.monthly?.USD ?? 0),
    annualUsd: Number(addon.annualUsd ?? addon.pricing?.annual?.USD ?? 0),
    monthlyNgn: Number(addon.monthlyNgn ?? addon.pricing?.monthly?.NGN ?? 0),
    annualNgn: Number(addon.annualNgn ?? addon.pricing?.annual?.NGN ?? 0),
    eligiblePlans: Array.isArray(addon.eligiblePlans) ? addon.eligiblePlans : [],
  }));
};

export const findSabyPlanInCatalog = (
  catalog: SabyPricingCatalog | null | undefined,
  planId?: string | null
) =>
  catalogPlansToArray(catalog).find(
    (plan) => plan.id === String(planId || '').toLowerCase()
  ) || findSabyPlan(planId);

export const getSabyPlansFromCatalog = (
  catalog: SabyPricingCatalog | null | undefined
) => catalogPlansToArray(catalog);

export const findSabyAddonInCatalog = (
  catalog: SabyPricingCatalog | null | undefined,
  addonId?: string | null
) =>
  catalogAddonsToArray(catalog).find(
    (addon) => addon.id === String(addonId || '').toLowerCase()
  ) || findSabyAddon(addonId);

export const SABY_PRICING_PLANS: SabyPricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams making the switch from spreadsheets.',
    monthlyUsd: 9,
    annualUsd: 84,
    monthlyNgn: 16500,
    annualNgn: 158400,
    monthlyPeriodLabel: 'per month',
    annualPeriodLabel: 'per year',
    subline: '1 organizational node, up to 3 users',
    controlLabel: 'Monthly reporting',
    ctaLabel: 'Start now',
    featureHeading: 'Included:',
    note: 'For small teams',
    includedQuotas: {
      forms: 1,
      nodes: 1,
      seats: 3,
      storageMb: 100,
      submissionsPerMonth: 500,
      apiRatePerHour: 100,
      auditRetentionDays: 7,
    },
    includedCapabilities: ['web_forms', 'monthly_reporting'],
    features: [
      'Data Studio, Data Hub, Reports & Storage (100 MB)',
      'Identity & Access (basic roles)',
      'Compliance Calendar (monthly)',
      'Portal-based ingestion (self-service)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for replacing spreadsheets and manual reporting.',
    monthlyUsd: 29,
    annualUsd: 288,
    monthlyNgn: 31500,
    annualNgn: 302400,
    monthlyPeriodLabel: 'per month',
    annualPeriodLabel: 'per year',
    subline: 'Up to 3 organizational nodes, up to 10 users',
    controlLabel: 'Monthly reporting',
    ctaLabel: 'Get started',
    featureHeading: 'Included (all Starter features plus):',
    note: 'Growing teams',
    includedQuotas: {
      forms: 10,
      nodes: 3,
      seats: 10,
      storageMb: 2048,
      submissionsPerMonth: 5000,
      apiRatePerHour: 1000,
      auditRetentionDays: 30,
    },
    includedCapabilities: ['web_forms', 'monthly_reporting', 'api_access', 'embed'],
    features: [
      'Standard support (email 48h)',
      'All ingestion channels (web, API, embed)',
      '2 GB storage',
      '5,000 submissions/month',
    ],
    highlightCta: true,
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Most popular for accountability across multi-branch teams.',
    monthlyUsd: 99,
    annualUsd: 948,
    monthlyNgn: 89000,
    annualNgn: 854400,
    monthlyPeriodLabel: 'per month',
    annualPeriodLabel: 'per year',
    subline: 'Up to 15 organizational nodes',
    controlLabel: 'Monthly + weekly reporting',
    ctaLabel: 'Get started',
    featureHeading: 'Included (all Pro features plus):',
    note: 'Multi-branch teams',
    includedQuotas: {
      forms: 50,
      nodes: 15,
      seats: 50,
      storageMb: 20480,
      submissionsPerMonth: 50000,
      apiRatePerHour: 5000,
      auditRetentionDays: 90,
    },
    includedCapabilities: [
      'web_forms',
      'monthly_reporting',
      'api_access',
      'embed',
      'workflows_approvals',
    ],
    features: [
      'Workflows & Approvals (up to 10)',
      'Communication Hub (email + WhatsApp + Telegram)',
      'Prebuilt operational reports',
      '20 GB storage, 50,000 submissions/mo',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Operations at scale with governance and custom delivery.',
    monthlyUsd: 299,
    annualUsd: 2988,
    monthlyNgn: 350000,
    annualNgn: 3360000,
    monthlyPeriodLabel: 'per month',
    annualPeriodLabel: 'per year',
    subline: 'Unlimited nodes, users, and submissions',
    controlLabel: 'Any reporting frequency',
    ctaLabel: 'Contact sales',
    featureHeading: 'Included (all Business features plus):',
    note: 'Custom pricing',
    contactSalesOnly: true,
    includedQuotas: {
      forms: 'unlimited',
      nodes: 'unlimited',
      seats: 'unlimited',
      storageMb: 'custom',
      submissionsPerMonth: 'unlimited',
      apiRatePerHour: 'custom',
      auditRetentionDays: 365,
    },
    includedCapabilities: [
      'web_forms',
      'monthly_reporting',
      'api_access',
      'embed',
      'workflows_approvals',
      'custom_integrations',
    ],
    features: [
      'Advanced workflows + automation rules',
      'All ingestion channels + custom integrations',
      'Audit & compliance controls (1 year retention)',
      'Unlimited storage',
      'Dedicated support SLA',
    ],
  },
];

export const DEFAULT_SABY_PRICING_CATALOG: SabyPricingCatalog = {
  plans: SABY_PRICING_PLANS,
  addons: SABY_PRICING_ADDONS,
  vatRate: 0.075,
  exchangeRates: {
    usdToNgn: 1500,
    source: 'manual',
    updatedAt: null,
  },
  discounts: {
    enabled: false,
    mode: 'percentage',
    value: 0,
    label: 'Finance discount',
  },
  discountRules: [],
  credits: {
    enabled: false,
    amount: 0,
    label: 'Finance credit',
  },
  creditRules: [],
  manualValidation: {
    enabled: true,
    note: 'Manual payment review available for finance admins.',
  },
  promoCodes: [],
  serviceFee: {
    enabled: true,
    rate: 0.015,
    flat: 100,
    min: 100,
    max: 5000,
    freeBelow: 500,
  },
};

export const findSabyPlan = (planId?: string | null) =>
  SABY_PRICING_PLANS.find((plan) => plan.id === String(planId || '').toLowerCase()) ||
  SABY_PRICING_PLANS[0];

export const findSabyAddon = (addonId?: string | null) =>
  SABY_PRICING_ADDONS.find((addon) => addon.id === String(addonId || '').toLowerCase()) ||
  null;

export const getSabyPlanAmount = ({
  plan,
  period,
  currency,
}: {
  plan: SabyPricingPlan;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
}) => {
  if (currency === 'NGN') {
    return period === 'annual' ? plan.annualNgn : plan.monthlyNgn;
  }
  return period === 'annual' ? plan.annualUsd : plan.monthlyUsd;
};

export const getSabyPlanAmountFromCatalog = ({
  catalog,
  planId,
  period,
  currency,
}: {
  catalog?: SabyPricingCatalog | null;
  planId: string;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
}) => {
  const plan = findSabyPlanInCatalog(catalog, planId);
  return getSabyPlanAmount({ plan, period, currency });
};

export const getSabyAddonAmount = ({
  addon,
  period,
  currency,
}: {
  addon: SabyPricingAddon;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
}) => {
  if (currency === 'NGN') {
    return period === 'annual' ? addon.annualNgn : addon.monthlyNgn;
  }
  return period === 'annual' ? addon.annualUsd : addon.monthlyUsd;
};

export const getSabyAddonAmountFromCatalog = ({
  catalog,
  addonId,
  period,
  currency,
}: {
  catalog?: SabyPricingCatalog | null;
  addonId: string;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
}) => {
  const addon = findSabyAddonInCatalog(catalog, addonId);
  return addon ? getSabyAddonAmount({ addon, period, currency }) : 0;
};

export const getPlanEntitlements = (planId?: string | null) =>
  findSabyPlan(planId).includedCapabilities || [];

export const getAddonCatalogForPlan = (
  planId?: string | null,
  catalog?: SabyPricingCatalog | null
) => {
  const plan = findSabyPlanInCatalog(catalog, planId);
  return catalogAddonsToArray(catalog).filter((addon) =>
    addon.eligiblePlans.includes(plan.id)
  );
};

export const normalizeSabyAddonIds = (
  value?: string | string[] | null,
  planId?: string | null,
  catalog?: SabyPricingCatalog | null
): SabyPricingAddonId[] => {
  const rawValues = Array.isArray(value)
    ? value
    : String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

  const allowedAddonIds = new Set(
    getAddonCatalogForPlan(planId, catalog).map((addon) => addon.id)
  );

  return Array.from(
    new Set(
      rawValues.filter((entry): entry is SabyPricingAddonId => {
        const normalized = String(entry || '').toLowerCase();
        return (
          Boolean(findSabyAddonInCatalog(catalog, normalized)) &&
          allowedAddonIds.has(normalized as SabyPricingAddonId)
        );
      })
    )
  );
};

export const calculateRecurringCharge = ({
  plan,
  period,
  currency,
  addonIds = [],
  catalog,
  code,
}: {
  plan: SabyPricingPlan;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
  addonIds?: SabyPricingAddonId[];
  catalog?: SabyPricingCatalog | null;
  code?: string | null;
}) => {
  const normalizedAddonIds = Array.from(new Set(addonIds));
  const selectedAddons = normalizedAddonIds
    .map((addonId) => findSabyAddonInCatalog(catalog, addonId))
    .filter((addon): addon is SabyPricingAddon => Boolean(addon));
  const planSubtotal = getSabyPlanAmount({ plan, period, currency });
  const addonsSubtotal = selectedAddons.reduce(
    (sum, addon) => sum + getSabyAddonAmount({ addon, period, currency }),
    0
  );
  const subtotal = planSubtotal + addonsSubtotal;
  const now = new Date();
  const isRuleActive = (rule: any) => {
    if (!rule || rule.enabled === false) return false;
    if (rule.currency && String(rule.currency).toUpperCase() !== currency)
      return false;
    if (rule.startsAt && new Date(rule.startsAt) > now) return false;
    if (rule.expiresAt && new Date(rule.expiresAt) < now) return false;
    return true;
  };
  const adjustmentAmount = (rule: any, baseAmount: number) =>
    rule.mode === 'fixed'
      ? Number(rule.value ?? rule.amount ?? 0)
      : (baseAmount * Number(rule.value ?? rule.amount ?? 0)) / 100;
  const matchCode = (entry: any, normalized: string) =>
    String(entry.code || entry.label || entry.id || '')
      .trim()
      .toUpperCase() === normalized;

  const normalizedCode = String(code || '').trim().toUpperCase();
  let resolvedType: 'discount' | 'promo' | 'credit' | null = null;
  let resolvedRule: any = null;

  if (normalizedCode) {
    const discountRule = (catalog?.discountRules || []).find((entry) =>
      matchCode(entry, normalizedCode)
    );
    if (discountRule && isRuleActive(discountRule)) {
      resolvedType = 'discount';
      resolvedRule = discountRule;
    } else {
      const promo = (catalog?.promoCodes || []).find((entry) =>
        matchCode(entry, normalizedCode)
      );
      if (
        promo &&
        isRuleActive(promo) &&
        (promo.maxRedemptions == null || Number(promo.maxRedemptions) > 0)
      ) {
        resolvedType = 'promo';
        resolvedRule = promo;
      } else {
        const creditRule = (catalog?.creditRules || []).find((entry) =>
          matchCode(entry, normalizedCode)
        );
        if (creditRule && isRuleActive(creditRule)) {
          resolvedType = 'credit';
          resolvedRule = creditRule;
        }
      }
    }
  }

  let codeValidation: { valid: boolean; message?: string } | null = null;
  if (normalizedCode && !resolvedRule) {
    codeValidation = {
      valid: false,
      message: 'Code is invalid or unavailable.',
    };
  } else if (normalizedCode && resolvedRule) {
    codeValidation = { valid: true };
  }

  const appliedDiscountRules: any[] = [];
  const appliedPromoResult: any = null;
  if (resolvedType === 'discount' && resolvedRule) {
    appliedDiscountRules.push({
      ...resolvedRule,
      amount: adjustmentAmount(resolvedRule, subtotal),
    });
  } else if (resolvedType === 'promo' && resolvedRule) {
    appliedDiscountRules.push({
      ...resolvedRule,
      amount: adjustmentAmount(resolvedRule, subtotal),
    });
  }
  const discountAmount = appliedDiscountRules.reduce(
    (sum, rule) => sum + Number(rule.amount || 0),
    0
  );
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const vatRate = Number(
    catalog?.vatRate || DEFAULT_SABY_PRICING_CATALOG.vatRate || 0
  );
  const tax = period === 'annual' ? taxableBase * vatRate : 0;

  const appliedCreditRules: any[] = [];
  if (resolvedType === 'credit' && resolvedRule) {
    appliedCreditRules.push({
      ...resolvedRule,
      amount: adjustmentAmount(resolvedRule, taxableBase + tax),
    });
  }
  const creditAmount = appliedCreditRules.reduce(
    (sum, rule) => sum + Number(rule.amount || 0),
    0
  );
  const total = Math.max(0, taxableBase + tax - creditAmount);

  return {
    planSubtotal,
    addonsSubtotal,
    subtotal,
    taxableBase,
    discount: {
      amount: discountAmount,
      appliedRules: appliedDiscountRules,
    },
    credits: {
      amount: creditAmount,
      appliedRules: appliedCreditRules,
    },
    resolvedType,
    resolvedAmount:
      resolvedType === 'credit'
        ? creditAmount
        : resolvedType
          ? discountAmount
          : 0,
    promo: resolvedType === 'promo' ? appliedDiscountRules[0] || null : null,
    codeValidation,
    tax,
    total,
    addOns: selectedAddons,
  };
};

export const calculateMeteredEstimate = ({
  seatOverage = 0,
  nodeOverage = 0,
  storageGbOverage = 0,
  submissionPacks = 0,
  apiPacks = 0,
  period,
  currency,
  plan,
}: {
  seatOverage?: number;
  nodeOverage?: number;
  storageGbOverage?: number;
  submissionPacks?: number;
  apiPacks?: number;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
  plan: SabyPricingPlan;
}) => {
  const multiplier = period === 'annual' ? 12 : 1;
  const seatRate =
    plan.id === 'business' ? (currency === 'NGN' ? 12000 : 8) : currency === 'NGN' ? 7500 : 5;
  const nodeRate =
    plan.id === 'business' ? (currency === 'NGN' ? 6000 : 4) : currency === 'NGN' ? 9000 : 6;
  const storageRate = currency === 'NGN' ? 7500 : 5;
  const submissionRate = currency === 'NGN' ? 3000 : 2;
  const apiRate = currency === 'NGN' ? 1500 : 1;

  return (
    (seatOverage * seatRate +
      nodeOverage * nodeRate +
      storageGbOverage * storageRate +
      submissionPacks * submissionRate +
      apiPacks * apiRate) *
    multiplier
  );
};

export const buildCheckoutPath = ({
  plan,
  period,
  currency,
  addOns = [],
}: {
  plan: SabyPlanTier;
  period: SabyBillingPeriod;
  currency: SabyBillingCurrency;
  addOns?: SabyPricingAddonId[];
}) => {
  const params = new URLSearchParams({
    plan,
    period,
    currency,
  });
  if (addOns.length > 0) {
    params.set('addOns', addOns.join(','));
  }
  return `/checkout?${params.toString()}`;
};
