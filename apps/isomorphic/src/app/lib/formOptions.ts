export type CascadingOption = {
  label: string;
  value: string;
  parent?: string;
};

const normalizeOptionValue = (value: unknown) =>
  String(value || '').trim().toLowerCase();

export const parseCascadingOptions = (
  optionsText: unknown,
  parentValue?: unknown,
  showAllWhenParentMissing = false
): CascadingOption[] => {
  const normalizedParent = normalizeOptionValue(parentValue);
  const options: CascadingOption[] = [];
  const source = Array.isArray(optionsText)
    ? optionsText.join('\n')
    : String(optionsText || '');

  source
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line
        .split(/\s*(?:->|>)\s*/)
        .map((part) => part.trim())
        .filter(Boolean);
      const parent = parts.length > 1 ? parts[0] : undefined;
      const value = parts.length > 1 ? parts.slice(1).join(' > ') : parts[0];

      if (parent && normalizedParent && normalizeOptionValue(parent) !== normalizedParent) {
        return;
      }
      if (parent && !normalizedParent && !showAllWhenParentMissing) return;

      options.push({ label: value, value, ...(parent ? { parent } : {}) });
    });

  return options;
};

export const parseFlatOptions = (optionsText: unknown): CascadingOption[] =>
  String(optionsText || '')
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => ({ label: value, value }));
