import { COUNTRY_CODE_OPTIONS, DEFAULT_COUNTRY_CODE } from '@/data/country-codes';

export type PublicPhoneCountryOption = {
  countryName: string;
  dialCode: string;
  flag: string;
  isoCode: string | null;
  label: string;
  value: string;
};

const normalizeCountryName = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const parseCountryNameFromLabel = (label: string) =>
  String(label || '')
    .replace(/\(\+[^)]*\)\s*$/i, '')
    .trim();

const REGION_ALIAS_TO_ISO: Record<string, string> = {
  'american samoa': 'AS',
  'british virgin islands': 'VG',
  'caribbean netherlands': 'BQ',
  'cape verde': 'CV',
  'congo brazzaville': 'CG',
  'congo kinshasa': 'CD',
  'cote divoire': 'CI',
  curacao: 'CW',
  czechia: 'CZ',
  eswatini: 'SZ',
  'falkland islands': 'FK',
  'faroe islands': 'FO',
  'french polynesia': 'PF',
  guernsey: 'GG',
  jersey: 'JE',
  laos: 'LA',
  'macau sar china': 'MO',
  'myanmar burma': 'MM',
  'new caledonia': 'NC',
  'niue': 'NU',
  'north korea': 'KP',
  'north macedonia': 'MK',
  'palestinian territories': 'PS',
  reunion: 'RE',
  'saint barthelemy': 'BL',
  'saint martin': 'MF',
  'sao tome and principe': 'ST',
  'sint maarten': 'SX',
  'south korea': 'KR',
  syria: 'SY',
  'timor leste': 'TL',
  'u s virgin islands': 'VI',
  'vatican city': 'VA',
  'western sahara': 'EH',
};

const regionNameMap = (() => {
  const map = new Map<string, string>();
  if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
    return map;
  }

  const display = new Intl.DisplayNames(['en'], { type: 'region' });
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  for (let i = 0; i < letters.length; i += 1) {
    for (let j = 0; j < letters.length; j += 1) {
      const code = `${letters[i]}${letters[j]}`;
      const name = display.of(code);
      if (!name || name === code) continue;
      map.set(normalizeCountryName(name), code);
    }
  }

  return map;
})();

const resolveIsoCode = (countryName: string): string | null => {
  const normalized = normalizeCountryName(countryName);
  if (!normalized) return null;
  const alias = REGION_ALIAS_TO_ISO[normalized];
  if (alias) return alias;
  return regionNameMap.get(normalized) || null;
};

const toFlagEmoji = (isoCode: string | null): string => {
  if (!isoCode || !/^[A-Z]{2}$/.test(isoCode)) return '🌐';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const normalizeDialCode = (code: string) => {
  const digits = String(code || '').replace(/[^\d]/g, '');
  return digits ? `+${digits}` : DEFAULT_COUNTRY_CODE;
};

const uniqueDialCodesDesc = Array.from(
  new Set(COUNTRY_CODE_OPTIONS.map((item) => normalizeDialCode(item.value)))
).sort((a, b) => b.length - a.length);

export const PUBLIC_PHONE_COUNTRY_OPTIONS: PublicPhoneCountryOption[] = COUNTRY_CODE_OPTIONS.map(
  (option) => {
    const countryName = parseCountryNameFromLabel(option.label);
    const dialCode = normalizeDialCode(option.value);
    const isoCode = resolveIsoCode(countryName);
    const flag = toFlagEmoji(isoCode);
    return {
      countryName,
      dialCode,
      flag,
      isoCode,
      label: `${flag} ${countryName} (${dialCode})`,
      value: dialCode,
    };
  }
);

export const sanitizePhoneDigits = (value: string) =>
  String(value || '').replace(/[^\d]/g, '');

const trimLocalLeadingZero = (value: string) => String(value || '').replace(/^0+/, '');

export const splitInternationalPhone = (
  rawValue: string,
  fallbackCode: string = DEFAULT_COUNTRY_CODE
) => {
  const input = String(rawValue || '').trim();
  if (!input) {
    return {
      countryCode: normalizeDialCode(fallbackCode),
      localNumber: '',
    };
  }

  const digitsOnly = sanitizePhoneDigits(input);
  if (!digitsOnly) {
    return {
      countryCode: normalizeDialCode(fallbackCode),
      localNumber: '',
    };
  }

  const normalizedFallback = normalizeDialCode(fallbackCode);
  const treatAsInternational = input.startsWith('+');
  const withPlus = `+${digitsOnly}`;
  const matchedCode = treatAsInternational
    ? uniqueDialCodesDesc.find((code) => withPlus.startsWith(code))
    : null;
  const countryCode = matchedCode || normalizedFallback;
  const localRaw = matchedCode ? withPlus.slice(matchedCode.length) : digitsOnly;
  const localNumber = trimLocalLeadingZero(sanitizePhoneDigits(localRaw));

  return {
    countryCode,
    localNumber,
  };
};

export const composeInternationalPhone = (countryCode: string, rawLocalNumber: string) => {
  const normalizedCode = normalizeDialCode(countryCode);
  const localDigits = trimLocalLeadingZero(sanitizePhoneDigits(rawLocalNumber));
  if (!localDigits) return '';
  return `${normalizedCode}${localDigits}`;
};
