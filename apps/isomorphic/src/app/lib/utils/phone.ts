const DEFAULT_COUNTRY_CODE = '234';

export const normalizePhoneToE164 = (value?: string | null): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const normalizedChars = raw.replace(/[^\d+]/g, '');
  if (!normalizedChars) return '';

  const hasPlus = normalizedChars.startsWith('+');
  const digits = normalizedChars.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    const nsn = digits.slice(DEFAULT_COUNTRY_CODE.length);
    if (nsn.length === 10) return `+${DEFAULT_COUNTRY_CODE}${nsn}`;
    if (nsn.length === 11 && nsn.startsWith('0')) {
      return `+${DEFAULT_COUNTRY_CODE}${nsn.slice(1)}`;
    }
  }

  if (!hasPlus && digits.length === 11 && digits.startsWith('0')) {
    return `+${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  }

  if (!hasPlus && digits.length === 10) {
    return `+${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  if (hasPlus && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (!hasPlus && digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  return '';
};

export const formatPhoneInternational = (value?: string | null): string => {
  const canonical = normalizePhoneToE164(value);
  if (!canonical) return '';

  const digits = canonical.slice(1);
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length === 13) {
    const local = digits.slice(DEFAULT_COUNTRY_CODE.length);
    return `+${DEFAULT_COUNTRY_CODE} ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }

  if (digits.length > 6) {
    return `+${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return canonical;
};
