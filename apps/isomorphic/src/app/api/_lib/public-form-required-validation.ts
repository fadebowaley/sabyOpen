import { buildInternalApiUrl } from './backend-url';

export type PublicFormElement = {
  id?: string;
  type?: string;
  properties?: {
    required?: boolean;
    hidden?: boolean;
    validation?: {
      required?: boolean;
    };
  };
};

const NON_INPUT_TYPES = new Set([
  'header',
  'paragraph',
  'description',
  'spacer',
  'divider',
  'hidden',
  'button',
  'endpointsubmission',
  'captcha',
]);

const normalizeType = (value: unknown) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'datepicker') return 'date';
  if (normalized === 'timepicker') return 'time';
  if (normalized === 'dropdown') return 'select';
  if (normalized === 'fileupload') return 'file';
  return normalized;
};

const isEmptySubmissionValue = (value: unknown) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

export const findMissingRequiredFields = (
  elements: PublicFormElement[],
  submissionData: Record<string, unknown>
) => {
  const missing: string[] = [];

  for (const element of elements) {
    const fieldId = String(element?.id || '');
    if (!fieldId) continue;

    const elementType = normalizeType(element?.type);
    if (NON_INPUT_TYPES.has(elementType)) continue;
    if (element?.properties?.hidden) continue;

    const required = Boolean(
      element?.properties?.required || element?.properties?.validation?.required
    );
    if (!required) continue;

    if (isEmptySubmissionValue(submissionData[fieldId])) {
      missing.push(fieldId);
    }
  }

  return missing;
};

export const fetchPublicFormElementsByReference = async (
  reference: string
): Promise<PublicFormElement[] | null> => {
  const response = await fetch(
    buildInternalApiUrl(`/project-forms/public/ref/${reference}`),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!response.ok) return null;
  const payload = await response.json().catch(() => ({}));
  return Array.isArray((payload as any)?.elements)
    ? ((payload as any).elements as PublicFormElement[])
    : null;
};
