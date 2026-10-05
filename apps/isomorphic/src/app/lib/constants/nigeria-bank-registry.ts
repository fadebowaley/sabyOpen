export type NigeriaBankCategory =
  | 'Deposit Money Bank'
  | 'Payment Service Bank'
  | 'Microfinance Bank'
  | 'Mortgage Bank'
  | 'Other';

export interface NigeriaBankRegistryEntry {
  name: string;
  code: string;
  category: NigeriaBankCategory;
  active: boolean;
  source: 'internal' | 'paystack' | 'merged';
}

const INTERNAL_BANK_OVERRIDES: NigeriaBankRegistryEntry[] = [
  { name: 'Access Bank', code: '044', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Citibank Nigeria', code: '023', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Ecobank Nigeria', code: '050', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Fidelity Bank', code: '070', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'First Bank of Nigeria', code: '011', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'First City Monument Bank', code: '214', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Globus Bank', code: '00103', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Guaranty Trust Bank', code: '058', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Jaiz Bank', code: '301', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Keystone Bank', code: '082', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Lotus Bank', code: '303', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Optimus Bank', code: '107', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Parallex Bank', code: '526', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Polaris Bank', code: '076', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'PremiumTrust Bank', code: '105', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Providus Bank', code: '101', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Stanbic IBTC Bank', code: '221', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Sterling Bank', code: '232', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'SunTrust Bank', code: '100', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Titan Trust Bank', code: '102', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Union Bank of Nigeria', code: '032', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'United Bank For Africa', code: '033', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Unity Bank', code: '215', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Wema Bank', code: '035', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: 'Zenith Bank', code: '057', category: 'Deposit Money Bank', active: true, source: 'internal' },
  { name: '9mobile 9Payment Service Bank', code: '120001', category: 'Payment Service Bank', active: true, source: 'internal' },
  { name: 'HopePSB', code: '120002', category: 'Payment Service Bank', active: true, source: 'internal' },
  { name: 'MTN MoMo Payment Service Bank', code: '120003', category: 'Payment Service Bank', active: true, source: 'internal' },
  { name: 'Smartcash Payment Service Bank', code: '120004', category: 'Payment Service Bank', active: true, source: 'internal' },
  { name: 'Kuda Microfinance Bank', code: '090267', category: 'Microfinance Bank', active: true, source: 'internal' },
  { name: 'Moniepoint Microfinance Bank', code: '090405', category: 'Microfinance Bank', active: true, source: 'internal' },
  { name: 'Opay', code: '100004', category: 'Microfinance Bank', active: true, source: 'internal' },
  { name: 'Palmpay', code: '100033', category: 'Microfinance Bank', active: true, source: 'internal' },
  { name: 'VFD Microfinance Bank', code: '090110', category: 'Microfinance Bank', active: true, source: 'internal' },
];

const inferCategory = (name: string): NigeriaBankCategory => {
  const normalized = name.toLowerCase();
  if (
    normalized.includes('payment service bank') ||
    normalized.includes('psb') ||
    normalized.includes('momo') ||
    normalized.includes('smartcash')
  ) {
    return 'Payment Service Bank';
  }
  if (normalized.includes('microfinance bank') || normalized.includes('mfb')) {
    return 'Microfinance Bank';
  }
  if (normalized.includes('mortgage bank')) {
    return 'Mortgage Bank';
  }
  if (
    normalized.includes('bank') ||
    normalized.includes('trust') ||
    normalized.includes('merchant')
  ) {
    return 'Deposit Money Bank';
  }
  return 'Other';
};

export function mergeNigeriaBanks(
  liveBanks: Array<{ name?: string; code?: string; active?: boolean }> = []
): NigeriaBankRegistryEntry[] {
  const byName = new Map<string, NigeriaBankRegistryEntry>();

  for (const entry of INTERNAL_BANK_OVERRIDES) {
    byName.set(entry.name.toLowerCase(), entry);
  }

  for (const live of liveBanks) {
    const name = String(live?.name || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = byName.get(key);
    const merged: NigeriaBankRegistryEntry = {
      name,
      code: String(live?.code || existing?.code || '').trim(),
      category: existing?.category || inferCategory(name),
      active: live?.active !== false,
      source: existing ? 'merged' : 'paystack',
    };
    byName.set(key, merged);
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export const fallbackNigeriaBankRegistry = INTERNAL_BANK_OVERRIDES;
