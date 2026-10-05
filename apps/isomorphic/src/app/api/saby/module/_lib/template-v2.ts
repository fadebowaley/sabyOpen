import 'server-only';

import type { FormTemplate } from '@/app/(berrylium)/haloform/templates/formTemplates';

type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TemplateWorkflowActionType =
  | 'SUBMIT'
  | 'REVIEW'
  | 'APPROVE'
  | 'ESCALATE'
  | 'NOTIFY';

export type TemplatePaymentPolicyMode = 'steady' | 'active' | 'mixed';

export type TemplatePaymentProcessorChannel =
  | 'sabypipe'
  | 'paystack'
  | 'flutterwave';

export type TemplateUtilityType =
  | 'payment_policy'
  | 'file_storage'
  | 'date_event'
  | 'threshold_guard'
  | 'status_route'
  | 'consent_gate'
  | 'text_intelligence'
  | 'contact_automation'
  | 'geo_policy'
  | 'repeatable_aggregate'
  | 'identity_validation'
  | 'reference_integrity';

export type TemplateWorkflowStepDefault = {
  id: string;
  name: string;
  actionType: TemplateWorkflowActionType;
  allowedRoles: string[];
  requiredApprovals?: number;
  order: number;
};

export type TemplatePaymentPolicyDefault = {
  id: string;
  name: string;
  active: boolean;
  priority: number;
  scopeType: 'all' | 'node' | 'family' | 'level' | 'category';
  scopeRef: string;
  mode: 'steady' | 'active';
  fixedAmount?: number;
  formula?: string;
  settings?: Record<string, unknown>;
  conditions?: string[];
  enforcement?: {
    requiredOnSubmission?: boolean;
    blockSubmissionOnFailure?: boolean;
  };
};

export type TemplateV2 = {
  templateMeta: {
    id: string;
    name: string;
    description: string;
    industry: string;
    category: string;
    difficulty: TemplateDifficulty;
    estimatedTime: string;
    tags: string[];
    icon: string;
    preview: string;
  };
  formStructure: {
    elements: any[];
    style: string;
    wizardMode: boolean;
    columnSpans: Record<string, number>;
  };
  workflowPolicyDefaults: {
    enabled: boolean;
    steps: TemplateWorkflowStepDefault[];
    notifications?: {
      onEveryIncident?: boolean;
    };
  };
  paymentPolicyDefaults: {
    enabled: boolean;
    mode: TemplatePaymentPolicyMode;
    policies: TemplatePaymentPolicyDefault[];
  };
  paymentConfigDefaults: {
    enabled: boolean;
    defaultChannel?: TemplatePaymentProcessorChannel;
    enabledChannels: TemplatePaymentProcessorChannel[];
  };
  utilityDefaults: {
    suggested: TemplateUtilityType[];
  };
};

type TemplateDefaultBundle = Pick<
  TemplateV2,
  | 'workflowPolicyDefaults'
  | 'paymentPolicyDefaults'
  | 'paymentConfigDefaults'
  | 'utilityDefaults'
>;

const PAYMENT_TEMPLATE_IDS = new Set([
  'customer-purchase',
  'donor-registration',
  'church-offering',
]);

const WORKFLOW_OPTIONAL_TEMPLATE_IDS = new Set([
  'policy-feedback',
  'course-evaluation',
]);

const EXPLICIT_TEMPLATE_DEFAULTS: Record<string, TemplateDefaultBundle> = {
  'church-attendance': {
    workflowPolicyDefaults: {
      enabled: true,
      notifications: { onEveryIncident: true },
      steps: [
        {
          id: 'wf_review_attendance',
          name: 'Attendance Review',
          actionType: 'REVIEW',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 1,
        },
        {
          id: 'wf_approve_attendance',
          name: 'Attendance Approve',
          actionType: 'APPROVE',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 2,
        },
      ],
    },
    paymentPolicyDefaults: {
      enabled: false,
      mode: 'steady',
      policies: [],
    },
    paymentConfigDefaults: {
      enabled: false,
      enabledChannels: [],
    },
    utilityDefaults: {
      suggested: ['date_event', 'repeatable_aggregate', 'threshold_guard'],
    },
  },
  'church-offering': {
    workflowPolicyDefaults: {
      enabled: true,
      notifications: { onEveryIncident: true },
      steps: [
        {
          id: 'wf_review_offering',
          name: 'Offering Review',
          actionType: 'REVIEW',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 1,
        },
        {
          id: 'wf_approve_offering',
          name: 'Offering Approve',
          actionType: 'APPROVE',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 2,
        },
      ],
    },
    paymentPolicyDefaults: {
      enabled: true,
      mode: 'mixed',
      policies: [
        {
          id: 'pp_church_offering_steady',
          name: 'Steady Offering',
          active: true,
          priority: 1,
          scopeType: 'all',
          scopeRef: 'all',
          mode: 'steady',
          fixedAmount: 1000,
          settings: {
            currency: 'NGN',
            note: 'Base offering amount per submission.',
          },
          enforcement: {
            requiredOnSubmission: true,
            blockSubmissionOnFailure: true,
          },
        },
        {
          id: 'pp_church_offering_active',
          name: 'Active Offering',
          active: true,
          priority: 2,
          scopeType: 'all',
          scopeRef: 'all',
          mode: 'active',
          formula: 'value(total_offering) * 0.1',
          settings: {
            deriveFrom: 'expression',
            note: 'Derived offering split from captured figure.',
          },
          enforcement: {
            requiredOnSubmission: false,
            blockSubmissionOnFailure: false,
          },
        },
      ],
    },
    paymentConfigDefaults: {
      enabled: true,
      defaultChannel: 'sabypipe',
      enabledChannels: ['sabypipe', 'paystack', 'flutterwave'],
    },
    utilityDefaults: {
      suggested: [
        'payment_policy',
        'repeatable_aggregate',
        'reference_integrity',
        'file_storage',
      ],
    },
  },
  'church-membership': {
    workflowPolicyDefaults: {
      enabled: true,
      notifications: { onEveryIncident: true },
      steps: [
        {
          id: 'wf_review_membership',
          name: 'Membership Review',
          actionType: 'REVIEW',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 1,
        },
        {
          id: 'wf_approve_membership',
          name: 'Membership Approve',
          actionType: 'APPROVE',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 2,
        },
      ],
    },
    paymentPolicyDefaults: {
      enabled: false,
      mode: 'steady',
      policies: [],
    },
    paymentConfigDefaults: {
      enabled: false,
      enabledChannels: [],
    },
    utilityDefaults: {
      suggested: [
        'identity_validation',
        'contact_automation',
        'reference_integrity',
      ],
    },
  },
  'donor-registration': {
    workflowPolicyDefaults: {
      enabled: true,
      notifications: { onEveryIncident: true },
      steps: [
        {
          id: 'wf_review_donor',
          name: 'Donor Review',
          actionType: 'REVIEW',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 1,
        },
        {
          id: 'wf_approve_donor',
          name: 'Donor Approve',
          actionType: 'APPROVE',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 2,
        },
      ],
    },
    paymentPolicyDefaults: {
      enabled: true,
      mode: 'mixed',
      policies: [
        {
          id: 'pp_donor_steady',
          name: 'Steady Donation',
          active: true,
          priority: 1,
          scopeType: 'all',
          scopeRef: 'all',
          mode: 'steady',
          fixedAmount: 1000,
          settings: {
            currency: 'NGN',
            note: 'Default recurring donation baseline.',
          },
          enforcement: {
            requiredOnSubmission: true,
            blockSubmissionOnFailure: true,
          },
        },
        {
          id: 'pp_donor_active',
          name: 'Active Donation',
          active: true,
          priority: 2,
          scopeType: 'all',
          scopeRef: 'all',
          mode: 'active',
          formula: 'value(pledge_amount) * 0.1',
          settings: {
            deriveFrom: 'expression',
            note: 'Derived donation amount based on pledge.',
          },
          enforcement: {
            requiredOnSubmission: false,
            blockSubmissionOnFailure: false,
          },
        },
      ],
    },
    paymentConfigDefaults: {
      enabled: true,
      defaultChannel: 'sabypipe',
      enabledChannels: ['sabypipe', 'paystack', 'flutterwave'],
    },
    utilityDefaults: {
      suggested: ['payment_policy', 'reference_integrity', 'file_storage'],
    },
  },
  'program-impact': {
    workflowPolicyDefaults: {
      enabled: true,
      notifications: { onEveryIncident: true },
      steps: [
        {
          id: 'wf_review_impact',
          name: 'Impact Review',
          actionType: 'REVIEW',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 1,
        },
        {
          id: 'wf_approve_impact',
          name: 'Impact Approve',
          actionType: 'APPROVE',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 2,
        },
      ],
    },
    paymentPolicyDefaults: {
      enabled: false,
      mode: 'steady',
      policies: [],
    },
    paymentConfigDefaults: {
      enabled: false,
      enabledChannels: [],
    },
    utilityDefaults: {
      suggested: ['reference_integrity', 'file_storage', 'text_intelligence'],
    },
  },
  'event-attendance': {
    workflowPolicyDefaults: {
      enabled: true,
      notifications: { onEveryIncident: true },
      steps: [
        {
          id: 'wf_review_event',
          name: 'Event Review',
          actionType: 'REVIEW',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 1,
        },
        {
          id: 'wf_approve_event',
          name: 'Event Approve',
          actionType: 'APPROVE',
          allowedRoles: [],
          requiredApprovals: 1,
          order: 2,
        },
      ],
    },
    paymentPolicyDefaults: {
      enabled: false,
      mode: 'steady',
      policies: [],
    },
    paymentConfigDefaults: {
      enabled: false,
      enabledChannels: [],
    },
    utilityDefaults: {
      suggested: ['date_event', 'repeatable_aggregate', 'threshold_guard'],
    },
  },
};

const TEMPLATE_UTILITY_DEFAULTS: Record<string, TemplateUtilityType[]> = {
  'kyc-onboarding': [
    'identity_validation',
    'contact_automation',
    'reference_integrity',
  ],
  'loan-application': [
    'reference_integrity',
    'threshold_guard',
    'status_route',
  ],
  'transaction-report': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'fraud-incident': ['reference_integrity', 'threshold_guard', 'status_route'],
  'compliance-filing': [
    'reference_integrity',
    'threshold_guard',
    'status_route',
  ],
  'energy-consumption': ['geo_policy', 'file_storage', 'threshold_guard'],
  'sensor-maintenance': ['geo_policy', 'file_storage', 'threshold_guard'],
  'equipment-performance': ['geo_policy', 'file_storage', 'threshold_guard'],
  'emission-report': ['geo_policy', 'file_storage', 'threshold_guard'],
  'energy-outage': ['geo_policy', 'file_storage', 'threshold_guard'],
  'patient-registration': [
    'identity_validation',
    'contact_automation',
    'reference_integrity',
  ],
  'diagnostic-test': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'clinical-trial': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'doctor-consultation': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'healthcare-compliance': [
    'reference_integrity',
    'threshold_guard',
    'status_route',
  ],
  'citizen-service-request': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'budget-allocation': [
    'reference_integrity',
    'threshold_guard',
    'status_route',
  ],
  'infrastructure-monitoring': [
    'geo_policy',
    'file_storage',
    'threshold_guard',
  ],
  'policy-feedback': [
    'text_intelligence',
    'status_route',
    'reference_integrity',
  ],
  'customer-purchase': [
    'payment_policy',
    'reference_integrity',
    'file_storage',
  ],
  'inventory-update': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'student-enrollment': [
    'identity_validation',
    'contact_automation',
    'reference_integrity',
  ],
  'course-evaluation': [
    'text_intelligence',
    'status_route',
    'reference_integrity',
  ],
  'research-submission': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'donor-registration': [
    'payment_policy',
    'reference_integrity',
    'file_storage',
  ],
  'program-impact': [
    'reference_integrity',
    'file_storage',
    'text_intelligence',
  ],
  'volunteer-signup': [
    'identity_validation',
    'contact_automation',
    'reference_integrity',
  ],
  'grant-application': [
    'reference_integrity',
    'threshold_guard',
    'status_route',
  ],
  'event-attendance': ['date_event', 'repeatable_aggregate', 'threshold_guard'],
  'church-attendance': [
    'date_event',
    'repeatable_aggregate',
    'threshold_guard',
  ],
  'church-offering': ['payment_policy', 'reference_integrity', 'file_storage'],
  'church-property': ['geo_policy', 'file_storage', 'threshold_guard'],
  'church-membership': [
    'identity_validation',
    'contact_automation',
    'reference_integrity',
  ],
};

const MATRIX_TEMPLATE_IDS = new Set(Object.keys(TEMPLATE_UTILITY_DEFAULTS));
const PAYMENT_REQUIRED_TEMPLATE_IDS = new Set([
  'customer-purchase',
  'donor-registration',
  'church-offering',
]);

const toSafeSlug = (value: string) =>
  normalizeTemplateId(value).replace(/[^a-z0-9]+/g, '_');

const buildWorkflowSteps = (
  templateId: string,
  mode: 'standard' | 'optional'
): TemplateWorkflowStepDefault[] => {
  const safeId = toSafeSlug(templateId);
  if (mode === 'optional') {
    return [
      {
        id: `wf_review_${safeId}`,
        name: 'Review',
        actionType: 'REVIEW',
        allowedRoles: [],
        requiredApprovals: 1,
        order: 1,
      },
    ];
  }
  return [
    {
      id: `wf_review_${safeId}`,
      name: 'Review',
      actionType: 'REVIEW',
      allowedRoles: [],
      requiredApprovals: 1,
      order: 1,
    },
    {
      id: `wf_approve_${safeId}`,
      name: 'Approve',
      actionType: 'APPROVE',
      allowedRoles: [],
      requiredApprovals: 1,
      order: 2,
    },
  ];
};

const buildMatrixWorkflowDefaults = (
  templateId: string
): TemplateV2['workflowPolicyDefaults'] => {
  const optional = WORKFLOW_OPTIONAL_TEMPLATE_IDS.has(templateId);
  return {
    enabled: !optional,
    steps: buildWorkflowSteps(templateId, optional ? 'optional' : 'standard'),
    notifications: {
      onEveryIncident: !optional,
    },
  };
};

const buildMatrixPaymentPolicyDefaults = (
  templateId: string
): TemplateV2['paymentPolicyDefaults'] => {
  if (!PAYMENT_REQUIRED_TEMPLATE_IDS.has(templateId)) {
    return {
      enabled: false,
      mode: 'steady',
      policies: [],
    };
  }
  return {
    enabled: true,
    mode: 'mixed',
    policies: [
      {
        id: `pp_steady_${toSafeSlug(templateId)}`,
        name: 'Steady Income',
        active: true,
        priority: 1,
        scopeType: 'all',
        scopeRef: 'all',
        mode: 'steady',
        fixedAmount: 1000,
        settings: {
          currency: 'NGN',
          note: 'Default fixed collection rule. Adjust amount/scope as needed.',
        },
        enforcement: {
          requiredOnSubmission: true,
          blockSubmissionOnFailure: true,
        },
      },
      {
        id: `pp_active_${toSafeSlug(templateId)}`,
        name: 'Active Income',
        active: true,
        priority: 2,
        scopeType: 'all',
        scopeRef: 'all',
        mode: 'active',
        formula: 'value(total) * 0.1',
        settings: {
          deriveFrom: 'expression',
          note: 'Default derived collection rule. Update formula to match module fields.',
        },
        enforcement: {
          requiredOnSubmission: false,
          blockSubmissionOnFailure: false,
        },
      },
    ],
  };
};

const buildMatrixTemplateDefaults = (
  templateId: string
): TemplateDefaultBundle | null => {
  const utilityDefaults = TEMPLATE_UTILITY_DEFAULTS[templateId];
  if (!utilityDefaults) return null;
  const paymentPolicyDefaults = buildMatrixPaymentPolicyDefaults(templateId);
  return {
    workflowPolicyDefaults: buildMatrixWorkflowDefaults(templateId),
    paymentPolicyDefaults,
    paymentConfigDefaults: {
      enabled: paymentPolicyDefaults.enabled,
      defaultChannel: paymentPolicyDefaults.enabled ? 'sabypipe' : undefined,
      enabledChannels: paymentPolicyDefaults.enabled
        ? ['sabypipe', 'paystack', 'flutterwave']
        : [],
    },
    utilityDefaults: {
      suggested: utilityDefaults,
    },
  };
};

const INDUSTRY_UTILITY_DEFAULTS: Record<string, TemplateUtilityType[]> = {
  'Financial Services & Fintech': [
    'identity_validation',
    'reference_integrity',
    'threshold_guard',
  ],
  'Energy, Utilities & IoT': ['geo_policy', 'file_storage', 'threshold_guard'],
  'Healthcare & Life Sciences': [
    'identity_validation',
    'reference_integrity',
    'file_storage',
  ],
  'Government & Public Sector': [
    'reference_integrity',
    'file_storage',
    'status_route',
  ],
  'Retail & Commerce': [
    'reference_integrity',
    'threshold_guard',
    'status_route',
  ],
  'Education & Research': [
    'identity_validation',
    'reference_integrity',
    'text_intelligence',
  ],
  'Non-Profit & Faith-Based': [
    'repeatable_aggregate',
    'reference_integrity',
    'date_event',
  ],
};

const normalizeTemplateId = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase();

const hasPaymentIntent = (template: FormTemplate): boolean => {
  const id = normalizeTemplateId(template.id);
  if (PAYMENT_TEMPLATE_IDS.has(id)) return true;
  const tags = Array.isArray(template.tags)
    ? template.tags.map((t) => String(t).toLowerCase())
    : [];
  const haystack = `${id} ${String(template.name || '').toLowerCase()} ${tags.join(' ')}`;
  return /(offering|donor|donation|tithe|purchase|payment|collection)/.test(
    haystack
  );
};

const buildWorkflowDefaults = (
  template: FormTemplate
): TemplateV2['workflowPolicyDefaults'] => {
  const templateId = normalizeTemplateId(template.id);
  if (WORKFLOW_OPTIONAL_TEMPLATE_IDS.has(templateId)) {
    return {
      enabled: false,
      steps: [],
      notifications: { onEveryIncident: false },
    };
  }
  return {
    enabled: true,
    notifications: { onEveryIncident: true },
    steps: [
      {
        id: 'wf_review',
        name: 'Review',
        actionType: 'REVIEW',
        allowedRoles: [],
        requiredApprovals: 1,
        order: 1,
      },
      {
        id: 'wf_approve',
        name: 'Approve',
        actionType: 'APPROVE',
        allowedRoles: [],
        requiredApprovals: 1,
        order: 2,
      },
    ],
  };
};

const buildPaymentPolicyDefaults = (
  template: FormTemplate
): TemplateV2['paymentPolicyDefaults'] => {
  if (!hasPaymentIntent(template)) {
    return {
      enabled: false,
      mode: 'steady',
      policies: [],
    };
  }
  return {
    enabled: true,
    mode: 'mixed',
    policies: [
      {
        id: 'pp_steady_base',
        name: 'Steady Income',
        active: true,
        priority: 1,
        scopeType: 'all',
        scopeRef: 'all',
        mode: 'steady',
        fixedAmount: 1000,
        settings: {
          currency: 'NGN',
          note: 'Default steady policy from template. Adjust to your context.',
        },
        enforcement: {
          requiredOnSubmission: true,
          blockSubmissionOnFailure: true,
        },
      },
      {
        id: 'pp_active_derived',
        name: 'Active Income',
        active: false,
        priority: 2,
        scopeType: 'all',
        scopeRef: 'all',
        mode: 'active',
        formula: 'value(total) * 0.1',
        settings: {
          deriveFrom: 'expression',
          note: 'Default active policy from template. Update expression/fields.',
        },
        enforcement: {
          requiredOnSubmission: false,
          blockSubmissionOnFailure: false,
        },
      },
    ],
  };
};

const buildPaymentConfigDefaults = (
  paymentPolicyDefaults: TemplateV2['paymentPolicyDefaults']
): TemplateV2['paymentConfigDefaults'] => {
  if (!paymentPolicyDefaults.enabled) {
    return {
      enabled: false,
      enabledChannels: [],
    };
  }
  return {
    enabled: true,
    defaultChannel: 'sabypipe',
    enabledChannels: ['sabypipe', 'paystack', 'flutterwave'],
  };
};

const inferUtilityDefaults = (
  template: FormTemplate
): TemplateUtilityType[] => {
  const industry = String(template.industry || 'General');
  const suggested = new Set<TemplateUtilityType>(
    INDUSTRY_UTILITY_DEFAULTS[industry] || []
  );
  if (hasPaymentIntent(template)) {
    suggested.add('payment_policy');
  }
  const tags = Array.isArray(template.tags)
    ? template.tags.map((t) => String(t).toLowerCase())
    : [];
  if (tags.some((tag) => /geo|location/.test(tag))) suggested.add('geo_policy');
  if (tags.some((tag) => /attendance|event/.test(tag)))
    suggested.add('date_event');
  if (tags.some((tag) => /compliance|risk/.test(tag)))
    suggested.add('threshold_guard');
  return Array.from(suggested);
};

export const isTemplateV2 = (value: unknown): value is TemplateV2 => {
  if (!value || typeof value !== 'object') return false;
  const template = value as TemplateV2;
  return Boolean(
    template.templateMeta?.id &&
      template.templateMeta?.name &&
      template.formStructure &&
      Array.isArray(template.formStructure.elements)
  );
};

export const toTemplateV2 = (
  template: FormTemplate | TemplateV2
): TemplateV2 => {
  if (isTemplateV2(template)) return template;

  const normalizedTemplateId = normalizeTemplateId(template.id);
  const matrixDefaults = MATRIX_TEMPLATE_IDS.has(normalizedTemplateId)
    ? buildMatrixTemplateDefaults(normalizedTemplateId)
    : null;
  const explicitDefaults = EXPLICIT_TEMPLATE_DEFAULTS[normalizedTemplateId];
  const workflowPolicyDefaults = buildWorkflowDefaults(template);
  const paymentPolicyDefaults = buildPaymentPolicyDefaults(template);
  const paymentConfigDefaults = buildPaymentConfigDefaults(
    paymentPolicyDefaults
  );
  const utilityDefaults = {
    suggested: inferUtilityDefaults(template),
  };

  return {
    templateMeta: {
      id: String(template.id),
      name: String(template.name),
      description: String(template.description || ''),
      industry: String(template.industry || 'General'),
      category: String(template.category || 'General'),
      difficulty:
        template.difficulty === 'beginner' ||
        template.difficulty === 'intermediate' ||
        template.difficulty === 'advanced'
          ? template.difficulty
          : 'intermediate',
      estimatedTime: String(template.estimatedTime || ''),
      tags: Array.isArray(template.tags)
        ? template.tags.map((tag) => String(tag))
        : [],
      icon: String(template.icon || ''),
      preview: String(template.preview || ''),
    },
    formStructure: {
      elements: Array.isArray(template.formData?.elements)
        ? template.formData.elements
        : [],
      style: String(template.formData?.style || 'default'),
      wizardMode: template.formData?.wizardMode !== false,
      columnSpans:
        template.formData?.columnSpans &&
        typeof template.formData.columnSpans === 'object'
          ? template.formData.columnSpans
          : {},
    },
    workflowPolicyDefaults:
      explicitDefaults?.workflowPolicyDefaults ||
      matrixDefaults?.workflowPolicyDefaults ||
      workflowPolicyDefaults,
    paymentPolicyDefaults:
      explicitDefaults?.paymentPolicyDefaults ||
      matrixDefaults?.paymentPolicyDefaults ||
      paymentPolicyDefaults,
    paymentConfigDefaults:
      explicitDefaults?.paymentConfigDefaults ||
      matrixDefaults?.paymentConfigDefaults ||
      paymentConfigDefaults,
    utilityDefaults:
      explicitDefaults?.utilityDefaults ||
      matrixDefaults?.utilityDefaults ||
      utilityDefaults,
  };
};
