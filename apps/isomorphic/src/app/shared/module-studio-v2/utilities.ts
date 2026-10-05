import type { ModuleDraftV2, ModuleFieldV2, ModuleUtilityType, ModuleUtilityV2 } from './contracts';

export const utilityTypeLabels: Record<ModuleUtilityType, string> = {
  payment_policy: 'Payment Policy',
  file_storage: 'File Storage',
  date_event: 'Date Event',
  threshold_guard: 'Threshold Guard',
  status_route: 'Status Route',
  consent_gate: 'Consent Gate',
  text_intelligence: 'Text Intelligence',
  contact_automation: 'Contact Automation',
  geo_policy: 'Geo Policy',
  repeatable_aggregate: 'Repeatable Aggregate',
  identity_validation: 'Identity Validation',
  reference_integrity: 'Reference Integrity',
};

export const detectUtilityCandidatesForField = (
  field: ModuleFieldV2
): ModuleUtilityType[] => {
  const kind = String(field?.kind || '').toLowerCase();
  if (['date', 'time', 'datetime'].includes(kind)) return ['date_event'];
  if (kind === 'file') return ['file_storage', 'identity_validation'];
  if (['number'].includes(kind)) return ['threshold_guard', 'payment_policy'];
  if (['select', 'radio', 'checkbox'].includes(kind))
    return ['status_route', 'consent_gate'];
  if (['text', 'textarea'].includes(kind)) return ['text_intelligence'];
  if (['email', 'phone'].includes(kind)) return ['contact_automation'];
  return [];
};

export const buildUtilityTemplate = (
  type: ModuleUtilityType,
  field?: ModuleFieldV2,
  currentCount = 0
): ModuleUtilityV2 => {
  const id = `util_${Date.now().toString(36)}`;
  const fieldKey = field?.key;
  return {
    id,
    type,
    name: `${utilityTypeLabels[type]} Rule ${currentCount + 1}`,
    enabled: true,
    priority: currentCount + 1,
    fieldKey,
    config:
      type === 'date_event'
        ? { event: 'on_date_reached', offsetDays: 0 }
        : type === 'file_storage'
          ? {
              storageFolder: `uploads/${fieldKey || 'files'}`,
              allowedTypes: ['image/*', 'application/pdf'],
              maxSizeMB: 10,
            }
          : type === 'payment_policy'
            ? { mode: 'fixed', amount: 0 }
            : type === 'threshold_guard'
              ? { operator: '>', threshold: 0 }
              : type === 'status_route'
                ? { match: 'value', routeTo: 'default_queue' }
                : type === 'consent_gate'
                  ? { requiredValue: true }
                  : type === 'text_intelligence'
                    ? { keywords: [], action: 'tag' }
                    : type === 'contact_automation'
                      ? { channel: 'email', trigger: 'on_submit' }
                      : type === 'geo_policy'
                        ? { by: 'state', map: {} }
                        : type === 'repeatable_aggregate'
                          ? { aggregate: 'sum', compareFieldKey: '' }
                          : type === 'identity_validation'
                            ? { idTypeFieldKey: '', fileFieldKey: fieldKey || '' }
                            : { referenceFieldKey: fieldKey || '', mustExist: true },
    conditions: [],
    actions: [],
    enforcement: {
      required: false,
      blockOnFailure: false,
    },
  };
};

export const getDraftUtilities = (draft: ModuleDraftV2 | null): ModuleUtilityV2[] => {
  const raw = draft?.behaviorHooks?.utilities;
  return Array.isArray(raw) ? raw : [];
};

export const setDraftUtilities = (
  draft: ModuleDraftV2,
  utilities: ModuleUtilityV2[]
): ModuleDraftV2 => ({
  ...draft,
  behaviorHooks: {
    ...(draft.behaviorHooks || {}),
    utilities,
  },
});
